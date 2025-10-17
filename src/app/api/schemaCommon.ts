import z from "zod";
import "zod-openapi/extend";
import {
  Chain,
  ChainFamily,
  ChainId,
  Curve,
  DeployContractType,
  EncodedTransactionFormat,
  HashFunction,
  SignatureFormat,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { CHAINS } from "../config/chains";

const stringToBigIntSchema = z
  .string()
  .refine(
    (value) =>
      !isNaN(Number(value)) &&
      Number.isInteger(Number(value)) &&
      String(value) === String(BigInt(value)) &&
      BigInt(value) >= 0n,
    () => ({ message: "amount must be a positive integer" })
  )
  .pipe(z.coerce.bigint());

const bigintToStringSchema = z.bigint().pipe(z.coerce.string());

const chainFamilySchema = z.nativeEnum(ChainFamily).openapi({
  description: "Family to which the chain belongs",
  ref: "ChainFamily",
});

const chainIdSchemaParams: z.RawCreateParams = {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return Object.values(ChainId).includes(ctx.data)
        ? { message: `Unsupported feature for chainId '${ctx.data}'` }
        : { message: `Unsupported chainId '${ctx.data}'` };
    }
    return { message: ctx.defaultError };
  },
};

const chainIdSchema = z.nativeEnum(ChainId, chainIdSchemaParams).openapi({
  description: "Unique adamik identifier of the chain",
  ref: "ChainId",
});

const getSupportedChainIdsSchema = (chainFilters: (chain: Chain) => boolean) => {
  const supportedChainIds = Object.values(CHAINS)
    .filter((chain) => !chain.comingSoon && chainFilters(chain))
    .map((chain) => chain.id);

  return z.enum(supportedChainIds as [ChainId, ...ChainId[]], chainIdSchemaParams);
};

const accountIdSchema = z.string().openapi({
  description: "Account identifier (address, xpub, etc) for the specified chain ID",
});

const featuresSetSchema = z.object({
  native: z.boolean(),
  tokens: z.boolean(),
  staking: z.boolean(),
});

const chainSupportedFeaturesSchema = z
  .object({
    read: z.object({
      token: z.boolean(),
      validators: z.boolean(),
      transaction: featuresSetSchema,
      account: z.object({
        balances: featuresSetSchema,
        transactions: featuresSetSchema,
      }),
    }),
    write: z.object({
      transaction: z.object({
        type: z.record(z.nativeEnum(TransactionMode), z.boolean()),
        field: z.object({
          memo: z.boolean(),
        }),
      }),
    }),
    utils: z.object({
      addresses: z.boolean(),
    }),
  })
  .readonly()
  .openapi({
    description: "List of supported features for the chain",
    ref: "ChainSupportedFeatures",
  });

const signerSpecSchema = z
  .object({
    curve: z.nativeEnum(Curve),
    hashFunction: z.nativeEnum(HashFunction),
    signatureFormat: z.nativeEnum(SignatureFormat),
    coinType: z.string(),
  })
  .openapi({
    description: "List of signer specificity for the chain",
    ref: "SignerSpec",
  });

const chainSchema = z
  .object({
    family: chainFamilySchema,
    id: chainIdSchema,
    nativeId: z.string(),
    name: z.string(),
    ticker: z.string(),
    decimals: z.number(),
    isTestnetFor: z.string().optional(),
    supportedFeatures: chainSupportedFeaturesSchema,
    signerSpec: signerSpecSchema,
  })
  .openapi({
    description: "Chain details and information",
    ref: "Chain",
  });

const tokenSchema = z.object({
  type: z.nativeEnum(TokenType),
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.number().or(z.string()).pipe(z.coerce.string()),
  contractAddress: z.string().optional(),
});

// Transactions fields schemas

const senderPubKeySchema = z.string().openapi({
  description:
    "Public key of the sender account, required in some situations. It is advised to provide it by default if you can.",
});

const senderAddressSchema = z.string().openapi({
  description: "Address or ID of the sender account.",
});

const recipientAddressSchema = z.string().openapi({
  description: "Address or ID of the recipient account.",
});

const contractTypeSchema = z.nativeEnum(DeployContractType).openapi({
  description: "Provider of the account contract. Only ArgentX is supported at the moment.",
});

const tokenIdSchema = z.string().openapi({
  description: "Unique ID of the token to transfer (e.g contract address for EVM chains)",
});

const inputAmountSchema = stringToBigIntSchema.openapi({
  description: "Optional amount to use (always in smallest unit). Use either this or useMaxAmount.",
});

const outputAmountSchema = bigintToStringSchema.openapi({
  description: "Amount to use, either provided or computed by the API",
});

const useMaxAmountSchema = z.boolean().openapi({
  description:
    "Option to let the API compute the amount to use all available funds. Either use this or provide amount.",
});

const inputFeesSchema = stringToBigIntSchema.openapi({
  description: "Transaction fees.",
});

const outputFeesSchema = bigintToStringSchema.openapi({
  description: "Transaction fees computed by the API.",
});

const inputGasSchema = stringToBigIntSchema.openapi({
  description: "Transaction gas, when relevant for the chain.",
});

const outputGasSchema = bigintToStringSchema.openapi({
  description: "Transaction gas computed by the API, when relevant for the chain.",
});

const inputNonceSchema = stringToBigIntSchema.openapi({
  description: "Transaction sequence number computed by the API, when relevant for the chain.",
});

const outputNonceSchema = bigintToStringSchema.openapi({
  description: "Transaction sequence number, when relevant for the chain.",
});

const memoSchema = z.string().openapi({
  description: "Optional free text field, that is supported for some chains.",
});

const inputParamsSchema = z.any().openapi({
  description:
    "Some additional chain-specific context computed by the API. If provided by the encode endpoint, it must be provided back as-is to the broadcast endpoint.",
});

const outputParamsSchema = z.unknown().openapi({
  description:
    "Some additional chain-specific context computed by the API. If provided by the encode endpoint, it must be provided back as-is to the broadcast endpoint.",
});

const validatorAddressSchema = z.string().openapi({
  description: "Address or ID of a validator",
});

const stakeIdSchema = z.string().openapi({
  description:
    "Unique identifier of a staking position. If provided in the account state data, it must be provided back in the transaction data when encoding a staking transaction.",
});

const stakingCompoundSchema = z.boolean().openapi({
  description:
    "When available for the chain, controls whether staking rewards are cashed or added to the staked funds.",
});

const proofOfPossessionSchema = z.string().openapi({
  description: "staker's address on this chain, signed with the foreign chain's signer. (hex)",
});

const stakerForeignPubKeySchema = z.string().openapi({
  description: "Staker's pubkey on the foreign chain. (hex)",
});

const inputStakedAmountSchema = stringToBigIntSchema.openapi({
  description: "Staked amount on the foreign chain.",
});

const outputStakedAmountSchema = bigintToStringSchema.openapi({
  description: "Staked amount on the foreign chain.",
});

const validatorPubKeySchema = z.string().openapi({
  description: "Validator's pubkey on the foreign chain. (hex)",
});

const signedStakingTransactionSchema = z.string().openapi({
  description: "Signed staking transaction on the foreign chain (hex).",
});

const signedSlashingTransactionSchema = z.string().openapi({
  description: "Signed slashing transaction on the foreign chain (hex).",
});

const unsignedUnbondingTransactionSchema = z.string().openapi({
  description:
    "Unsigned unbonding transaction on the foreign chain (as provided in the response of the encode request for the stake transaction).",
});

const signedUnbondingSlashingTransactionSchema = z.string().openapi({
  description: "Signed unbonding slashing transaction on the foreign chain (hex).",
});

// Transactions schemas

const inputDeployAccountSchema = z
  .object({
    mode: z.literal(TransactionMode.DEPLOY_ACCOUNT),
    senderPubKey: senderPubKeySchema,
    contractType: contractTypeSchema.optional().default(DeployContractType.ARGENTX),
  })
  .openapi({
    title: "Deploy Account",
    description: "Deploy a smart contract wallet account",
  });

const outputDeployAccountSchema = z
  .object({
    mode: z.literal(TransactionMode.DEPLOY_ACCOUNT),
    senderPubKey: senderPubKeySchema,
    contractType: contractTypeSchema,
  })
  .openapi({
    title: "Deploy Account",
    description: "Deploy a smart contract wallet account",
  });

const inputTransferNativeSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    recipientAddress: recipientAddressSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Transfer",
    description: "Transfer chain native coins",
  });

const outputTransferNativeSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    recipientAddress: recipientAddressSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Transfer",
    description: "Transfer chain native coins",
  });

const inputTransferTokenSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER_TOKEN),
    tokenId: tokenIdSchema,
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    recipientAddress: recipientAddressSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Transfer Token",
    description: "Transfer chain tokens",
  });

const outputTransferTokenSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER_TOKEN),
    tokenId: tokenIdSchema,
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    recipientAddress: recipientAddressSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Transfer Token",
    description: "Transfer chain tokens",
  });

const inputEnableTokenSchema = z
  .object({
    mode: z.literal(TransactionMode.ENABLE_TOKEN),
    tokenId: tokenIdSchema,
    senderAddress: senderAddressSchema,
  })
  .openapi({
    title: "Enable Token",
    description: "Enable an address to hold a token",
  });

const outputEnableTokenSchema = z
  .object({
    mode: z.literal(TransactionMode.ENABLE_TOKEN),
    tokenId: tokenIdSchema,
    senderAddress: senderAddressSchema,
  })
  .openapi({
    title: "Enable Token",
    description: "Enable an address to hold a token",
  });

const inputStakeSchema = z
  .object({
    mode: z.literal(TransactionMode.STAKE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    sourceValidatorAddress: z.string().optional().openapi({
      description:
        "Address or ID of a validator. Can be used to move staking funds from this validator instead of the sender's balance, if supported by the chain.",
    }),
    targetValidatorAddress: validatorAddressSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Stake",
    description: "Put some funds at stake",
  });

const outputStakeSchema = z
  .object({
    mode: z.literal(TransactionMode.STAKE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    sourceValidatorAddress: z.string().optional().openapi({
      description:
        "Address or ID of a validator. Can be used to move staking funds from this validator, if supported by the chain.",
    }),
    targetValidatorAddress: validatorAddressSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Stake",
    description: "Put some funds at stake",
  });

const inputUnstakeSchema = z
  .object({
    mode: z.literal(TransactionMode.UNSTAKE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    stakeId: stakeIdSchema.optional(),
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Unstake",
    description: "Stop staking some funds",
  });

const outputUnstakeSchema = z
  .object({
    mode: z.literal(TransactionMode.UNSTAKE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    stakeId: stakeIdSchema.optional(),
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Unstake",
    description: "Stop staking some funds",
  });

const inputClaimRewardsSchema = z
  .object({
    mode: z.literal(TransactionMode.CLAIM_REWARDS),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    stakeId: stakeIdSchema.optional(),
    compound: stakingCompoundSchema.default(false),
  })
  .openapi({
    title: "Claim Rewards",
    description: "Retrieve pending rewards from staking",
  });

const outputClaimRewardsSchema = z
  .object({
    mode: z.literal(TransactionMode.CLAIM_REWARDS),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    stakeId: stakeIdSchema.optional(),
    compound: stakingCompoundSchema,
  })
  .openapi({
    title: "Claim Rewards",
    description: "Retrieve pending rewards from staking",
  });

const inputWithdrawSchema = z
  .object({
    mode: z.literal(TransactionMode.WITHDRAW),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    amount: inputAmountSchema.optional(),
    validatorAddress: validatorAddressSchema,
    stakeId: stakeIdSchema.optional(),
  })
  .openapi({
    title: "Withdraw Unlocked Funds",
    description: "Move funds back from staking to your available balance",
  });

const outputWithdrawSchema = z
  .object({
    mode: z.literal(TransactionMode.WITHDRAW),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    amount: inputAmountSchema.optional(),
    validatorAddress: validatorAddressSchema,
    stakeId: stakeIdSchema.optional(),
  })
  .openapi({
    title: "Withdraw Unlocked Funds",
    description: "Move funds back from staking to your available balance",
  });

const inputConvertAssetSchema = z
  .object({
    mode: z.literal(TransactionMode.CONVERT_ASSET),
    from: z.object({
      amount: stringToBigIntSchema,
      tokenId: z.string(),
      address: z.string(),
    }),
    to: z.object({
      amount: stringToBigIntSchema.optional(),
      chainId: z.nativeEnum(ChainId).optional(),
      tokenId: z.string(),
      address: z.string(),
    }),
    includeFees: z.boolean(),
    slippage: z.number().min(0).max(1).optional(),
  })
  .openapi({
    title: "Convert from an asset to another",
    description:
      "Allows to convert from an asset (native or token) to another one, either on the same or on a different chain. The API determines whether swap and/or bridge operations are required.",
  });

const outputConvertAssetSchema = z
  .object({
    mode: z.literal(TransactionMode.CONVERT_ASSET),
    from: z.object({
      amount: bigintToStringSchema,
      tokenId: z.string(),
      address: z.string(),
    }),
    to: z.object({
      amount: bigintToStringSchema,
      chainId: z.nativeEnum(ChainId).optional(),
      tokenId: z.string(),
      address: z.string(),
    }),
    includeFees: z.boolean(),
    slippage: z.number().min(0).max(1).optional(),
  })
  .openapi({
    title: "Convert from an asset to another",
    description:
      "Allows to convert from an asset (native or token) to another one, either on the same or on a different chain. The API determines whether swap and/or bridge operations are required.",
  });

const inputRegisterStakeSchema = z
  .object({
    mode: z.literal(TransactionMode.REGISTER_STAKE),
    senderPubKey: senderPubKeySchema,
    senderForeignPubKey: stakerForeignPubKeySchema,
    senderAddress: senderAddressSchema,
    proofOfPossession: proofOfPossessionSchema,
    amount: inputStakedAmountSchema,
    validatorPubKey: validatorPubKeySchema,
    unsignedUnbondingTransaction: unsignedUnbondingTransactionSchema,
    signedStakingTransaction: signedStakingTransactionSchema,
    signedSlashingTransaction: signedSlashingTransactionSchema,
    signedUnbondingSlashingTransaction: signedUnbondingSlashingTransactionSchema,
  })
  .openapi({
    title: "Register Stake",
    description:
      "Only supported for Babylon staking at the moment. See documentation: https://docs.adamik.io/guides/tutorials/babylon-with-adamik",
  });

const outputRegisterStakeSchema = z
  .object({
    mode: z.literal(TransactionMode.REGISTER_STAKE),
    senderPubKey: senderPubKeySchema,
    senderForeignPubKey: stakerForeignPubKeySchema,
    senderAddress: senderAddressSchema,
    proofOfPossession: proofOfPossessionSchema,
    amount: outputStakedAmountSchema,
    stakerPubKey: stakerForeignPubKeySchema,
    validatorPubKey: validatorPubKeySchema,
    unsignedUnbondingTransaction: unsignedUnbondingTransactionSchema,
    signedStakingTransaction: signedStakingTransactionSchema,
    signedSlashingTransaction: signedSlashingTransactionSchema,
    signedUnbondingSlashingTransaction: signedUnbondingSlashingTransactionSchema,
  })
  .openapi({
    title: "Register Stake",
    description:
      "Only supported for Babylon staking at the moment. See documentation: https://docs.adamik.io/guides/tutorials/babylon-with-adamik",
  });

const encodedTransactionSchema = z.array(
  z.object({
    hash: z
      .object({
        format: z.nativeEnum(HashFunction),
        value: z.string(),
      })
      .optional()
      .openapi({
        description:
          "The transaction hash that needs to be signed. The format field indicates the hash function used to determine the hash value (e.g., KECCAK256 for EVM chains, SHA256 for Bitcoin, etc.).",
      }),
    raw: z
      .object({
        format: z.nativeEnum(EncodedTransactionFormat),
        value: z.string(),
      })
      .optional()
      .openapi({
        description:
          "The raw transaction data in a chain-specific format. The format field indicates the encoding format used to represent the transaction data (e.g., RLP for EVM chains, PSBT for Bitcoin, etc.).",
      }),
  })
);

const signatureSchema = z.string();

const optionalTickerSchema = z.string().optional().openapi({
  description:
    "Specific currency for that amount. If not provided, the amount is in the native currency of the chain.",
});

// FIXME Not convenient to manually maintain this aligned with FinalizedTransaction...
const finalizedTransactionSchema = z.object({
  raw: z.unknown(),
  parsed: z
    .object({
      id: z.string(),
      mode: z.nativeEnum(TransactionMode).or(z.literal("unknown")),
      state: z.nativeEnum(TransactionState),
      tokenId: z.string().optional(),
      blockHeight: bigintToStringSchema.optional(),
      timestamp: z
        .number()
        .pipe(z.coerce.string())
        .openapi({
          description: "Timestamp in milliseconds",
        })
        .optional(),
      fees: z.object({
        amount: outputAmountSchema,
        ticker: optionalTickerSchema,
      }),
      gas: outputGasSchema.optional(),
      nonce: outputNonceSchema.optional(),
      memo: memoSchema.optional(),
      senders: z
        .object({
          address: z.string(),
          amount: outputAmountSchema,
          ticker: optionalTickerSchema,
        })
        .array()
        .optional(),
      recipients: z
        .object({
          address: z.string(),
          amount: outputAmountSchema,
          ticker: optionalTickerSchema,
        })
        .array()
        .optional(),
      validators: z
        .object({
          source: z
            .object({
              address: z.string(),
              amount: outputAmountSchema.optional(),
              ticker: optionalTickerSchema,
            })
            .optional(),
          target: z
            .object({
              address: z.string(),
              amount: outputAmountSchema.optional(),
              ticker: optionalTickerSchema,
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

const paginationQueryParamsSchema = z.object({
  nextPage: z.string().optional().openapi({
    description:
      "Token from the previous response of this endpoint. Provide it here to fetch the next page of results.",
  }),
});

const paginatedResponseSchema = z.object({
  pagination: z.object({
    nextPage: z.string().or(z.null()).openapi({
      description: "Use the token from the previous response to retrieve the next page of results.",
    }),
  }),
});

const errorMsgSchema = z.object({
  message: z.string(),
});

const statusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
});

export {
  accountIdSchema,
  bigintToStringSchema,
  chainIdSchema,
  chainIdSchemaParams,
  chainSchema,
  contractTypeSchema,
  encodedTransactionSchema,
  finalizedTransactionSchema,
  getSupportedChainIdsSchema,
  inputAmountSchema,
  inputClaimRewardsSchema,
  inputConvertAssetSchema,
  inputDeployAccountSchema,
  inputEnableTokenSchema,
  inputFeesSchema,
  inputGasSchema,
  inputNonceSchema,
  inputParamsSchema,
  inputRegisterStakeSchema,
  inputStakeSchema,
  inputTransferNativeSchema,
  inputTransferTokenSchema,
  inputUnstakeSchema,
  inputWithdrawSchema,
  memoSchema,
  outputAmountSchema,
  outputClaimRewardsSchema,
  outputConvertAssetSchema,
  outputDeployAccountSchema,
  outputEnableTokenSchema,
  outputFeesSchema,
  outputGasSchema,
  outputNonceSchema,
  outputParamsSchema,
  outputRegisterStakeSchema,
  outputStakeSchema,
  outputTransferNativeSchema,
  outputTransferTokenSchema,
  outputUnstakeSchema,
  outputWithdrawSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
  recipientAddressSchema,
  senderAddressSchema,
  senderPubKeySchema,
  signatureSchema,
  stakeIdSchema,
  stakingCompoundSchema,
  statusSchema,
  tokenIdSchema,
  tokenSchema,
  useMaxAmountSchema,
  validatorAddressSchema,
};
