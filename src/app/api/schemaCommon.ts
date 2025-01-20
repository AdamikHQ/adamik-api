import z from "zod";
import "zod-openapi/extend";
import {
  ChainFamily,
  ChainId,
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
        type: featuresSetSchema,
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
  description: "TODO",
});

const senderAddressSchema = z.string().openapi({
  description: "TODO",
});

const recipientAddressSchema = z.string().openapi({
  description: "TODO",
});

const contractTypeSchema = z.string().openapi({
  description: "TODO",
});

const tokenIdSchema = z.string().openapi({
  description: "TODO",
});

const inputAmountSchema = stringToBigIntSchema.openapi({
  description: "TODO",
});

const outputAmountSchema = bigintToStringSchema.openapi({
  description: "TODO",
});

const useMaxAmountSchema = z.boolean().openapi({
  description: "TODO",
});

const feesSchema = bigintToStringSchema.openapi({
  description: "TODO",
});

const gasSchema = bigintToStringSchema.openapi({
  description: "TODO",
});

const nonceSchema = bigintToStringSchema.openapi({
  description: "TODO",
});

const memoSchema = z.string().openapi({
  description: "TODO",
});

const formatSchema = z.nativeEnum(EncodedTransactionFormat).openapi({
  description: "TODO",
});

const paramsSchema = z.unknown().openapi({
  description: "TODO",
});

const validatorSchema = z.string().openapi({
  description: "TODO",
});

const stakingCompoundSchema = z.boolean().openapi({
  description: "TODO",
});

// Transactions schemas

const inputDeployAccountSchema = z
  .object({
    mode: z.literal(TransactionMode.DEPLOY_ACCOUNT),
    senderPubKey: senderPubKeySchema,
    contractType: contractTypeSchema,
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
    validatorAddress: validatorSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Delegate",
    description: "TODO",
  });

const outputStakingDelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.DELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Delegate",
    description: "TODO",
  });

const inputStakingUndelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.UNDELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Undelegate",
    description: "TODO",
  });

const outputStakingUndelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.UNDELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Undelegate",
    description: "TODO",
  });

const inputStakingRedelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.REDELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    sourceValidatorAddress: validatorSchema,
    targetValidatorAddress: validatorSchema,
    amount: inputAmountSchema.optional(),
    useMaxAmount: useMaxAmountSchema.default(false),
  })
  .openapi({
    title: "Redelegate",
    description: "TODO",
  });

const outputStakingRedelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.REDELEGATE),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    sourceValidatorAddress: validatorSchema,
    targetValidatorAddress: validatorSchema,
    amount: outputAmountSchema,
    useMaxAmount: useMaxAmountSchema,
  })
  .openapi({
    title: "Redelegate",
    description: "TODO",
  });

const inputStakingClaimRewardsSchema = z
  .object({
    mode: z.literal(TransactionMode.CLAIM_REWARDS),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorSchema,
    compound: stakingCompoundSchema.default(false),
  })
  .openapi({
    title: "ClaimRewards",
    description: "TODO",
  });

const outputStakingClaimRewardsSchema = z
  .object({
    mode: z.literal(TransactionMode.CLAIM_REWARDS),
    senderAddress: senderAddressSchema,
    senderPubKey: senderPubKeySchema.optional(),
    validatorAddress: validatorSchema,
    compound: stakingCompoundSchema,
  })
  .openapi({
    title: "ClaimRewards",
    description: "TODO",
  });

const inputTransactionDataSchema = z
  .object({
    memo: memoSchema.optional(),
    format: formatSchema.optional(),
  })
  .and(
    z.discriminatedUnion("mode", [
      inputDeployAccountSchema,
      inputTransferNativeSchema,
      inputStakingDelegateSchema,
      inputTransferTokenSchema,
      inputStakingUndelegateSchema,
      inputStakingRedelegateSchema,
      inputStakingClaimRewardsSchema,
    ])
  );

const outputTransactionDataSchema = z
  .object({
    fees: feesSchema,
    gas: gasSchema.optional(),
    nonce: nonceSchema.optional(),
    memo: memoSchema.optional(),
    format: formatSchema.optional(),
    params: paramsSchema.optional(),
  })
  .and(
    z.discriminatedUnion("mode", [
      outputDeployAccountSchema,
      outputTransferNativeSchema,
      outputTransferTokenSchema,
      outputStakingDelegateSchema,
      outputStakingUndelegateSchema,
      outputStakingRedelegateSchema,
      outputStakingClaimRewardsSchema,
    ])
  );

// NOTE: 'any' here because 'encoded' can also be JSON
// Improvement could be to properly type all possible encoded formats for every family
// FIXME 'any' with zod always makes the field optional... which is a problem here, but found no easy worakround
// Best fix is probably to enforce only string, by using JSON.stringify with anything else
const encodedTransactionSchema = z.string().or(z.any());

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
      gas: gasSchema.optional(),
      nonce: nonceSchema.optional(),
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
  encodedTransactionSchema,
  finalizedTransactionSchema,
  getSupportedChainIdsSchema,
  inputTransactionDataSchema,
  outputTransactionDataSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
  signatureSchema,
  statusSchema,
  tokenSchema,
};
