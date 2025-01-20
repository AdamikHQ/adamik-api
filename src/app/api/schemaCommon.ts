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
import { cosmosTransactionParamsSchema } from "../families/cosmos/types";
import { starknetTransactionParamsSchema } from "../families/starknet/types";
import { tonTransactionParamsSchema } from "../families/ton/types";
import { tronTransactionParamsSchema } from "../families/tron/types";

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

const accountIdSchema = z.string().openapi({
  description: "Account identifier (address, xpub, etc) for the specified chain ID",
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
  example: ChainId.BITCOIN,
  ref: "ChainId",
});

const getSupportedChainIdsSchema = (supportedChainIds: ChainId[]) =>
  z.enum(supportedChainIds as [ChainId, ...ChainId[]], chainIdSchemaParams);

const errorMsgSchema = z.object({
  message: z.string(),
});

const statusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
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
  params: z.any().optional(),
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

const outputDeployWalletContractSchema = z
  .object({
    mode: z.literal(TransactionMode.DEPLOY_WALLET_CONTRACT),
    pubkey: z.string(),
    type: z.string(),
  })
  .openapi({
    title: "DeployWalletContract",
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
      sender: z.string().optional(),
      recipient: z.string().optional(),
      fees: stringOrNumToBigintSchema.optional(),
      gas: stringOrNumToBigintSchema.optional(),
      nonce: stringOrNumToBigintSchema.optional(),
      memo: z.string().optional(),
      format: z.nativeEnum(EncodedTransactionFormat).optional(), // FIXME: move elsewere, this field is specifying something outside of this object(encoded tx format)
      params: z
        .union([
          starknetTransactionParamsSchema,
          tronTransactionParamsSchema,
          cosmosTransactionParamsSchema,
          tonTransactionParamsSchema,
        ])
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
        outputDeployWalletContractSchema,
      ])
    ),
});

const outputTransactionDataSchema = z.object({
  data: z
    .object({
      sender: z.string().optional(),
      recipient: z.string().optional(),
      useMaxAmount: z.boolean().default(false),
      fees: bigintToStringSchema.optional(),
      gas: bigintToStringSchema.optional(),
      nonce: bigintToStringSchema.optional(),
      memo: z.string().optional(),
      format: z.nativeEnum(EncodedTransactionFormat).optional(), // FIXME: move elsewere, this field is specifying something outside of this object(encoded tx format)
      params: z
        .union([
          starknetTransactionParamsSchema,
          tronTransactionParamsSchema,
          cosmosTransactionParamsSchema,
          tonTransactionParamsSchema,
        ])
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
        outputDeployWalletContractSchema,
      ])
    ),
});

const encodedTransactionSchema = z.object({
  // NOTE: 'any' here because 'encoded' can also be JSON
  // Improvement could be to properly type all possible encoded formats for every family
  // FIXME 'any' with zod always makes the field optional... which is a problem here, but found no easy worakround
  // Best fix is probably to enforce only string, by using JSON.stringify with anything else
  encoded: z.string().or(z.any()),
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

export {
  accountIdSchema,
  bigintToStringSchema,
  chainIdSchema,
  chainIdSchemaParams,
  chainSchema,
  checkEitherAmountOrUseMaxAmount,
  encodedTransactionSchema,
  finalizedTransactionSchema,
  getSupportedChainIdsSchema,
  inputTransactionDataSchema,
  outputTransactionDataSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
  signedAndEncodedTransactionSchema,
  statusSchema,
  tokenSchema,
};
