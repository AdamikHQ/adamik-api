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

// DOMAIN TYPES //////////////////////////////////////////////////////////////

const chainIdSchema = z.nativeEnum(ChainId, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { message: `unsupported value "${ctx.data}" encountered` };
    }
    return { message: ctx.defaultError };
  },
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

const recipientSchema = z.object({
  address: z.string(),
  amount: positiveBigintSchema.optional(),
});

const transferNativeSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER),
  })
  .openapi({
    // ref: "Transfer",
    title: "Transfer",
    description: "Transfer chain native coins",
  });

const transferTokenSchema = z
  .object({
    mode: z.literal(TransactionMode.TRANSFER_TOKEN),
    tokenId: z.string(),
  })
  .openapi({
    // ref: "TransferToken",
    title: "TransferToken",
    description: "Transfer chain tokens",
  });

const transferDelegateSchema = z
  .object({
    mode: z.literal(TransactionMode.DELEGATE),
    validateAddress: z.string().optional(), // TODO: rename to validatorAddress?
  })
  .openapi({
    // ref: "Delegate",
    title: "Delegate",
  });

const transactionDataSchema = z
  .object({
    chainId: chainIdSchema,
    mode: z.nativeEnum(TransactionMode),
    sender: z.string(),
    recipients: z.array(recipientSchema).nonempty(),
    useMaxAmount: z.boolean().default(false),
    fees: positiveBigintSchema,
    gas: z.string().optional(),
    nonce: z.string().optional(),
    memo: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(), // FIXME: move elsewere, this field is specifying something outside of this object(encoded tx format)
  })
  .and(z.discriminatedUnion("mode", [transferNativeSchema, transferDelegateSchema, transferTokenSchema]))
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
  .superRefine((data) => {
    if (data.useMaxAmount) {
      if (data.recipients.length > 1) {
        return {
          message: "Too many recipients. Only one recipient allowed when using useMaxAmount.",
          code: z.ZodIssueCode.too_big,
          path: ["recipients"],
        };
      }
      if (data.recipients[0].amount) {
        return {
          message: "Cannot specify amount when using useMaxAmount.",
          code: z.ZodIssueCode.invalid_type,
          path: ["recipients", 0, "amount"],
        };
      }
    } else {
      for (const recipient of data.recipients) {
        if (!recipient.amount) {
          return {
            message: "Missing amount for recipient with address " + recipient.address,
            code: z.ZodIssueCode.custom,
            path: ["recipients"],
          };
        }
      }
    }
  })
  .openapi({
    // ref: "Transaction",
    discriminator: {
      propertyName: "mode",
    },
  });

const errorMsgSchema = z.object({
  message: z.string(),
});

const transactionStatusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
});

const transactionSchema = z.object({
  data: transactionDataSchema,
});

const chainSchema = z.object({
  family: z.nativeEnum(ChainFamily),
  id: chainIdSchema,
  nativeId: z.string(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.string(),
  isTestnet: z.boolean().optional(),
  params: z.any().optional(),
  supportedFeatures: z.nativeEnum(ChainFeature).array(),
});

export {
  chainIdSchema,
  chainSchema,
  paginationSchema,
  transactionDataSchema,
  transactionSchema,
  transactionStatusSchema,
};
