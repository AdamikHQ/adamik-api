import z from "zod";
import { extendZodWithOpenApi } from "zod-openapi";
import {
  ChainFamily,
  ChainFeature,
  ChainId,
  EncodedTransactionFormat,
  TransactionMode,
} from "~/app/model/types_WIP";
import { getSupportedTransactionModes } from "../config/chains";

extendZodWithOpenApi(z);

const paginationSchema = z.object({
  limit: z.number(),
  offset: z.number(),
});

const errorMsgSchema = z.object({
  message: z.string(),
});

const positiveBigintSchema = z
  .number()
  .or(z.string())
  .or(z.bigint())
  .transform((data) => BigInt(data))
  .pipe(z.bigint().positive())
  .openapi({
    type: ["string"], // TODO: also document API for integers but only on input
  });

const chainIdSchema = z.nativeEnum(ChainId, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { message: `Unsupported chainId "${ctx.data}"` };
    }
    return { message: ctx.defaultError };
  },
});

const chainSchema = z.object({
  family: z.nativeEnum(ChainFamily),
  // The following line causes all chainIds to be listed for all chains, in the generated OpenAPI spec
  // TODO? Find how to generate swagger types, define a type for the ChainId enum,
  // then only reference that type each time instead of listing all its values
  id: chainIdSchema,
  nativeId: z.string(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.string(),
  isTestnet: z.boolean().optional(),
  params: z.any().optional(),
  supportedFeatures: z.nativeEnum(ChainFeature).array(),
});

const transferNativeSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER),
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
  .openapi({
    title: "TransferToken",
    description: "Transfer chain tokens",
  });

const stakingDelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.DELEGATE),
    validatorAddress: z.string(),
  })
  .openapi({
    title: "Delegate",
  });

const stakingUndelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.UNDELEGATE),
    validatorAddress: z.string(),
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

const transactionDataSchema = z
  .object({
    chainId: chainIdSchema,
    sender: z.string(),
    recipient: z.string(),
    amount: positiveBigintSchema.optional(),
    useMaxAmount: z.boolean().default(false),
    fees: positiveBigintSchema.optional(),
    gas: z.string().optional(),
    nonce: positiveBigintSchema.optional(),
    memo: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(), // FIXME: move elsewere, this field is specifying something outside of this object(encoded tx format)
  })
  .and(
    z.discriminatedUnion("mode", [
      transferNativeSchema,
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
  )
  // validation of recipients amount & useMaxAmount
  // -> only one recipient without an amount allowed when using useMaxAmount
  // -> all recipients must have an amount when not using useMaxAmount
  .superRefine((data, ctx) => {
    if (data.useMaxAmount && data.amount) {
      ctx.addIssue({
        message: "Cannot specify amount when using useMaxAmount and vice versa.",
        code: z.ZodIssueCode.custom,
        path: ["amount"],
      });
    } else if (!data.useMaxAmount && !data.amount) {
      ctx.addIssue({
        message: "Missing transaction amount (or set `useMaxAmount: true`).",
        code: z.ZodIssueCode.custom,
        path: ["amount"],
      });
    }
  });

const transactionStatusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
});

const transactionSchema = z.object({
  data: transactionDataSchema,
  // NOTE: 'any' here because encoded can also be JSON
  // Improvement could be to properly type all possible encoded formats for every family
  encoded: z.string().or(z.any()),
  signature: z.string(),
});

export {
  chainIdSchema,
  chainSchema,
  paginationSchema,
  transactionDataSchema,
  transactionSchema,
  transactionStatusSchema,
};
