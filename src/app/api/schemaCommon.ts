import z from "zod";

import { ChainFamily, ChainId, EncodedTransactionFormat, TransactionMode } from "~/app/model/types_WIP";
import { extendZodWithOpenApi } from "zod-openapi";

extendZodWithOpenApi(z);

const paginationSchema = z.object({
  limit: z.number(),
  offset: z.number(),
});

// TODO Experiment with modular zod schemas:
/*
const commonTransactionSchema = z.object({
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  amount: z.string(),
  useMaxAmount: z.boolean(),
  fees: z.string().optional(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  memo: z.string().optional(),
  format: z.string().optional(),
})

const transferTransactionSchema = z.object({
  mode: z.literal("transfer"),
});

const delegateTransactionSchema = z.object({
  mode: z.literal("delegate"),
  validatorAddress: z.string()
})

const plainTransactionSchema = commonTransactionSchema.and(z.union([transferTransactionSchema, delegateTransactionSchema,]));
//*/

// DOMAIN TYPES //////////////////////////////////////////////////////////////

const chainIdSchema = z.nativeEnum(ChainId, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { message: `unsupported value "${ctx.data}" encountered` };
    }
    return { message: ctx.defaultError };
  }
}).openapi({
  description: "Chain ID",
  example: ChainId.ETHEREUM,
});

const toNumber = z.number().or(z.string()).pipe(z.coerce.number());
const positiveBigintSchema = z.bigint().or(toNumber).pipe(z.coerce.bigint().positive()).openapi({ type: "string" });

const recipientSchema = z.object({
  amount: positiveBigintSchema,
  recipient: z.string(),
});

const plainTransactionSchema = z.object({
  chainId: chainIdSchema,
  mode: z.nativeEnum(TransactionMode),
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  // TODO should be only one of [amount, useMaxAmount]
  amount: z.string().optional(),
  useMaxAmount: z.boolean().optional(),
  fees: z.string().optional(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  memo: z.string().optional(),
  format: z.nativeEnum(EncodedTransactionFormat).optional(),
});

const transactionContentUnion = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal(TransactionMode.DELEGATE),
    senders: z.array(z.string()),
    recipients: z.array(z.string()),
    // TODO should be only one of [amount, useMaxAmount]
    amount: z.string().optional(),
    useMaxAmount: z.boolean().optional(),
    fees: z.string().optional(),
    gas: z.string().optional(),
    nonce: z.string().optional(),
    memo: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
  }),
  z.object({
    mode: z.literal(TransactionMode.TRANSFER),
    senders: z.array(z.string()),
    recipients: z.array(z.string()),
    // TODO should be only one of [amount, useMaxAmount]
    amount: z.string().optional(),
    useMaxAmount: z.boolean().optional(),
    fees: z.string().optional(),
    gas: z.string().optional(),
    nonce: z.string().optional(),
    memo: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
  }),
  z.object({
    mode: z.literal(TransactionMode.TRANSFER_TOKEN),
    senders: z.array(z.string()),
    recipients: z.array(z.string()),
    // TODO should be only one of [amount, useMaxAmount]
    amount: z.string().optional(),
    useMaxAmount: z.boolean().optional(),
    fees: z.string().optional(),
    gas: z.string().optional(),
    nonce: z.string().optional(),
    memo: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
  }),
  z.object({
    mode: z.literal(TransactionMode.TRANSFER_TO_MANY),
    sender: z.string(),
    recipients: z.array(recipientSchema),
    fees: positiveBigintSchema.optional(),
    memo: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
  }),
])

const transactionWrapperSchema = z.object({
  chainId: z.nativeEnum(ChainId),
}).and(transactionContentUnion);

const errorMsgSchema = z.object({
  message: z.string(),
});

const transactionStatusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
});

const chainSchema = z.object({
  id: chainIdSchema,
  name: z.string(),
  family: z.nativeEnum(ChainFamily),
  isTestnet: z.boolean().optional(),
  params: z.any().optional(),
});

export {
  paginationSchema,
  plainTransactionSchema,
  transactionWrapperSchema,
  transactionStatusSchema,
  chainIdSchema,
  chainSchema,
};
