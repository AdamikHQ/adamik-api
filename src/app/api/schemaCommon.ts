import z from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import {
  ChainFamily,
  ChainId,
  EncodedTransactionFormat,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { getSupportedTransactionModes } from "../config/chains";
import { cosmosTransactionParamsSchema } from "../families/cosmos/types";
import { tonTransactionParamsSchema } from "../families/ton/types";
import { tronTransactionParamsSchema } from "../families/tron/types";
import { deepBigintToString } from "../tools/convertors/deepBigintToString";

extendZodWithOpenApi(z);

// Used for input conversion, to allow for strings or numbers
const stringOrNumToBigintSchema = z
  .number()
  .or(z.string())
  .refine(
    (value) =>
      !isNaN(Number(value)) &&
      Number.isInteger(Number(value)) &&
      String(value) === String(BigInt(value)) &&
      BigInt(value) >= 0n,
    (value) => ({
      message: `value "${value}" must be a positive integer`,
    })
  )
  .pipe(z.coerce.bigint());

// Used for output conversion, to allow for bigints to always be returned as strings
const bigintToStringSchema = z.bigint().pipe(z.coerce.string());

const chainIdSchema = z
  .nativeEnum(ChainId, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: `Unsupported chainId "${ctx.data}"` };
      }
      return { message: ctx.defaultError };
    },
  })
  .openapi({
    description: "Unique adamik identifier of the chain",
    example: ChainId.BITCOIN,
    ref: "ChainId",
  });

const errorMsgSchema = z.object({
  message: z.string(),
});

const statusSchema = z
  .object({
    errors: z.array(errorMsgSchema),
    warnings: z.array(errorMsgSchema),
  })
  .default({ errors: [], warnings: [] });

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
  params: z.any().optional(),
  supportedFeatures: chainSupportedFeaturesSchema,
});

const tokenSchema = z.object({
  chainId: chainIdSchema,
  type: z.nativeEnum(TokenType),
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.number().or(z.string()).pipe(z.coerce.string()),
  contractAddress: z.string().optional(),
});

// validation of recipients amount & useMaxAmount
// -> only one recipient without an amount allowed when using useMaxAmount
// -> all recipients must have an amount when not using useMaxAmount
function checkEitherAmountOrUseMaxAmount(
  data: { useMaxAmount: boolean; amount?: bigint | undefined },
  ctx: z.RefinementCtx
) {
  if (data.useMaxAmount && data.amount !== undefined) {
    ctx.addIssue({
      message: "amount and useMaxAmount cannot be used together",
      code: z.ZodIssueCode.custom,
      path: ["amount"],
    });
  } else if (!data.useMaxAmount && data.amount === undefined) {
    ctx.addIssue({
      message: "Missing amount or useMaxAmount",
      code: z.ZodIssueCode.custom,
      path: ["amount"],
    });
  }
}

const amountFieldSchema = z.object({
  amount: stringOrNumToBigintSchema.optional(),
});

const inputTransferNativeSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER),
  })
  .merge(amountFieldSchema)
  .openapi({
    title: "Transfer",
    description: "Transfer chain native coins",
  });

const outputTransferNativeSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER),
    amount: bigintToStringSchema.optional(),
  })
  .openapi({
    title: "Transfer",
    description: "Transfer chain native coins",
  });

const transferTokenSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER_TOKEN),
    tokenId: z.string(),
  })
  .merge(amountFieldSchema)
  .openapi({
    title: "TransferToken",
    description: "Transfer chain tokens",
  });

const outputTransferTokenSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER_TOKEN),
    amount: bigintToStringSchema.optional(),
    tokenId: z.string(),
  })
  .openapi({
    title: "TransferToken",
    description: "Transfer chain tokens",
  });

const stakingDelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.DELEGATE),
    validatorAddress: z.string(),
  })
  .merge(amountFieldSchema)
  .openapi({
    title: "Delegate",
  });

const outputStakingDelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.DELEGATE),
    validatorAddress: z.string(),
    amount: bigintToStringSchema.optional(),
  })
  .openapi({
    title: "Delegate",
  });

const stakingUndelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.UNDELEGATE),
    validatorAddress: z.string(),
  })
  .merge(amountFieldSchema)
  .openapi({
    title: "Undelegate",
  });

const outputStakingUndelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.UNDELEGATE),
    validatorAddress: z.string(),
    amount: bigintToStringSchema.optional(),
  })
  .openapi({
    title: "Undelegate",
  });

const stakingRedelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.REDELEGATE),
    sourceValidatorAddress: z.string(),
    targetValidatorAddress: z.string(),
  })
  .merge(amountFieldSchema)
  .openapi({
    title: "Redelegate",
  });

const outputStakingRedelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.REDELEGATE),
    sourceValidatorAddress: z.string(),
    targetValidatorAddress: z.string(),
    amount: bigintToStringSchema.optional(),
  })
  .openapi({
    title: "Redelegate",
  });

const stakingClaimRewardsSchema = z
  .object({
    mode: z.literal(TransactionMode.CLAIM_REWARDS),
    validatorAddress: z.string(),
    compound: z.boolean().optional(),
  })
  .openapi({
    title: "ClaimRewards",
  });

const inputTransactionDataSchema = z.object({
  data: z
    .object({
      chainId: chainIdSchema,
      sender: z.string(),
      recipient: z.string(),
      fees: stringOrNumToBigintSchema.optional(),
      gas: stringOrNumToBigintSchema.optional(),
      nonce: stringOrNumToBigintSchema.optional(),
      memo: z.string().optional(),
      format: z.nativeEnum(EncodedTransactionFormat).optional(), // FIXME: move elsewere, this field is specifying something outside of this object(encoded tx format)
      params: z
        .union([cosmosTransactionParamsSchema, tronTransactionParamsSchema, tonTransactionParamsSchema])
        .or(z.any())
        .optional(),
      useMaxAmount: z.boolean().default(false),
    })
    .and(
      z.discriminatedUnion("mode", [
        inputTransferNativeSchema,
        stakingDelegateSchema,
        transferTokenSchema,
        stakingUndelegateSchema,
        stakingRedelegateSchema,
        stakingClaimRewardsSchema,
      ])
    )
    // validation of transaction mode VS chain features
    .refine(
      (data) => getSupportedTransactionModes(data.chainId).includes(data.mode),
      (data) => {
        return {
          message: `Transaction mode ${data.mode} is not supported for ${data.chainId}`,
          fatal: true,
          code: z.ZodIssueCode.invalid_enum_value,
          path: ["mode"],
          options: getSupportedTransactionModes(data.chainId),
        };
      }
    ),
});

const outputTransactionDataSchema = z.object({
  data: z
    .object({
      chainId: chainIdSchema,
      sender: z.string(),
      recipient: z.string(),
      useMaxAmount: z.boolean().default(false),
      fees: bigintToStringSchema.optional(),
      gas: bigintToStringSchema.optional(),
      nonce: bigintToStringSchema.optional(),
      memo: z.string().optional(),
      format: z.nativeEnum(EncodedTransactionFormat).optional(), // FIXME: move elsewere, this field is specifying something outside of this object(encoded tx format)
      params: z
        .union([cosmosTransactionParamsSchema, tronTransactionParamsSchema, tonTransactionParamsSchema])
        .or(z.any())
        .optional(), // FIXME: remove any and replace with BitcoinTransactionParams. For some reason, using it breaks the type system
    })
    .and(
      z.discriminatedUnion("mode", [
        outputTransferNativeSchema,
        outputStakingDelegateSchema,
        outputTransferTokenSchema,
        outputStakingUndelegateSchema,
        outputStakingRedelegateSchema,
        stakingClaimRewardsSchema,
      ])
    ),
});

const encodedTransactionSchema = z.object({
  // NOTE: 'any' here because 'encoded' can also be JSON
  // Improvement could be to properly type all possible encoded formats for every family
  encoded: z.string().or(
    z
      .any()
      .transform((data) => deepBigintToString(data))
      .pipe(z.any())
  ),
});

const signedAndEncodedTransactionSchema = encodedTransactionSchema.extend({
  signature: z.string(),
});

const optionalTickerSchema = z.string().optional().openapi({
  description:
    "Specific currency for that amount. If not provided, the amount is in the native currency of the chain.",
});

// FIXME Not convenient to manually maintain this aligned with FinalizedTransaction...
const finalizedTransactionSchema = z.object({
  raw: z
    .any()
    .transform((data) => deepBigintToString(data))
    .pipe(z.unknown()),
  parsed: z
    .object({
      chainId: chainIdSchema,
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
        amount: bigintToStringSchema,
        ticker: optionalTickerSchema,
      }),
      gas: bigintToStringSchema.optional(),
      nonce: bigintToStringSchema.optional(),
      memo: z.string().optional(),
      senders: z
        .object({
          address: z.string(),
          amount: bigintToStringSchema,
          ticker: optionalTickerSchema,
        })
        .array()
        .optional(),
      recipients: z
        .object({
          address: z.string(),
          amount: bigintToStringSchema,
          ticker: optionalTickerSchema,
        })
        .array()
        .optional(),
      validators: z
        .object({
          source: z
            .object({
              address: z.string(),
              amount: bigintToStringSchema,
              ticker: optionalTickerSchema,
            })
            .optional(),
          target: z
            .object({
              address: z.string(),
              amount: bigintToStringSchema,
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
      "Token that is provided in a previous response from this endpoint. \
    Just provide it here to get the next page of results from the endpoint",
  }),
});

const paginatedResponseSchema = z.object({
  pagination: z.object({
    nextPage: z.string().or(z.null()).openapi({
      description: "Use the token from the previous response to retrieve the next page of results.",
    }),
  }),
});

export {
  bigintToStringSchema,
  chainIdSchema,
  chainSchema,
  checkEitherAmountOrUseMaxAmount,
  encodedTransactionSchema,
  finalizedTransactionSchema,
  inputTransactionDataSchema,
  outputTransactionDataSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
  signedAndEncodedTransactionSchema,
  statusSchema,
  tokenSchema,
};
