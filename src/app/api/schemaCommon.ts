import z from "zod";
import "zod-openapi/extend";
import {
  ChainFamily,
  ChainId,
  DeployContractType,
  EncodedTransactionFormat,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";

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
  example: ChainId.BITCOIN,
  ref: "ChainId",
});

const getSupportedChainIdsSchema = (supportedChainIds: ChainId[]) =>
  z.enum(supportedChainIds as [ChainId, ...ChainId[]], chainIdSchemaParams);

const accountIdSchema = z.string().openapi({
  description: "Account identifier (address, xpub, etc) for the specified chain ID",
});

const featuresSetSchema = z.object({
  native: z.boolean(),
  tokens: z.boolean(),
  staking: z.boolean(),
});

const transactionModeSchema = () => {
  const transactionModes = Object.entries(TransactionMode).reduce((acc, [key, value]) => {
    acc[value] = z.boolean();
    return acc;
  }, {} as Record<TransactionMode, z.ZodType<boolean>>);

  return z.object(transactionModes);
};

z.nativeEnum(TransactionMode);

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
        type: transactionModeSchema(),
        field: z.object({
          memo: z.boolean(),
        }),
      }),
    }),
  })
  .readonly()
  .openapi({
    description: "List of supported features for the chain",
    ref: "ChainSupportedFeatures",
  });

const chainSchema = z.object({
  family: z.nativeEnum(ChainFamily),
  id: chainIdSchema,
  nativeId: z.string(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.number(),
  isTestnetFor: z.string().optional(),
  supportedFeatures: chainSupportedFeaturesSchema,
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
  description: "Address of the sender account.",
});

const recipientAddressSchema = z.string().openapi({
  description: "Address of the recipient account.",
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

const formatSchema = z.nativeEnum(EncodedTransactionFormat).openapi({
  description:
    "Controls the format of the returned encoded transaction. DEPRECATED, will be reworked at some point.",
});

const inputParamsSchema = z.any().openapi({
  description:
    "Some additional chain-specific context computed by the API. If provided by the encode endpoint, it must be provided back to the broadcast endpoint.",
});

const outputParamsSchema = z.unknown().openapi({
  description:
    "Some additional chain-specific context computed by the API. If provided by the encode endpoint, it must be provided back to the broadcast endpoint.",
});

const validatorAddressSchema = z.string().openapi({
  description: "Address or ID of a validator",
});

const stakingCompoundSchema = z.boolean().openapi({
  description:
    "When available for the chain, controls whether staking rewards are cashed or added to the staked funds.",
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
    title: "TransferToken",
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
    title: "TransferToken",
    description: "Transfer chain tokens",
  });

const inputStakingDelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.DELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Delegate",
    description: "Put some funds at stake",
  });

const outputStakingDelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.DELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Delegate",
    description: "Put some funds at stake",
  });

const inputStakingUndelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.UNDELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Undelegate",
    description: "Stop staking some funds",
  });

const outputStakingUndelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.UNDELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Undelegate",
    description: "Stop staking some funds",
  });

const inputStakingRedelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.REDELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    sourceValidatorAddress: validatorAddressSchema,
    targetValidatorAddress: validatorAddressSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Redelegate",
    description: "Assign some staked funds to a different validator",
  });

const outputStakingRedelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.REDELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    sourceValidatorAddress: validatorAddressSchema,
    targetValidatorAddress: validatorAddressSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Redelegate",
    description: "Assign some staked funds to a different validator",
  });

const inputStakingClaimRewardsSchema = z
  .object({
    mode: z.literal(TransactionMode.CLAIM_REWARDS),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    compound: stakingCompoundSchema.default(false),
  })
  .openapi({
    title: "ClaimRewards",
    description: "Retrieve rewards from staking",
  });

const outputStakingClaimRewardsSchema = z
  .object({
    mode: z.literal(TransactionMode.CLAIM_REWARDS),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorAddressSchema,
    compound: stakingCompoundSchema,
  })
  .openapi({
    title: "ClaimRewards",
    description: "Retrieve rewards from staking",
  });

const encodedTransactionSchema = z.string();

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
              amount: outputAmountSchema,
              ticker: optionalTickerSchema,
            })
            .optional(),
          target: z
            .object({
              address: z.string(),
              amount: outputAmountSchema,
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
  formatSchema,
  getSupportedChainIdsSchema,
  inputAmountSchema,
  inputDeployAccountSchema,
  inputFeesSchema,
  inputGasSchema,
  inputNonceSchema,
  inputParamsSchema,
  inputStakingClaimRewardsSchema,
  inputStakingDelegateSchema,
  inputStakingRedelegateSchema,
  inputStakingUndelegateSchema,
  inputTransferNativeSchema,
  inputTransferTokenSchema,
  memoSchema,
  outputAmountSchema,
  outputDeployAccountSchema,
  outputFeesSchema,
  outputGasSchema,
  outputNonceSchema,
  outputParamsSchema,
  outputStakingClaimRewardsSchema,
  outputStakingDelegateSchema,
  outputStakingRedelegateSchema,
  outputStakingUndelegateSchema,
  outputTransferNativeSchema,
  outputTransferTokenSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
  recipientAddressSchema,
  senderAddressSchema,
  senderPubKeySchema,
  signatureSchema,
  stakingCompoundSchema,
  statusSchema,
  tokenIdSchema,
  tokenSchema,
  useMaxAmountSchema,
  validatorAddressSchema,
};
