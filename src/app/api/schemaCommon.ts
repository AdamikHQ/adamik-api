import z from "zod";

import { extendZodWithOpenApi } from "zod-openapi";
import { ChainFamily, ChainFeature, ChainId, EncodedTransactionFormat, TransactionMode } from "~/app/model/types_WIP";
import { cosmosTransactionParamsSchema } from "../families/cosmos/types";

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
  },
});

const toNumber = z.number().or(z.string()).pipe(z.coerce.number().positive());
const positiveBigintSchema = z.bigint().positive().or(toNumber).transform((data) => BigInt(data)).openapi({ type: "string" });

const recipientSchema = z.object({
  amount: positiveBigintSchema,
  address: z.string(),
});

const plainTransactionSchema = z.object({
  chainId: chainIdSchema,
  mode: z.nativeEnum(TransactionMode),
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  // TODO should be only one of [amount, useMaxAmount]
  amount: z.string().min(1).optional(),
  useMaxAmount: z.boolean().optional(),
  fees: z.string().optional(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  memo: z.string().optional(),
  format: z.nativeEnum(EncodedTransactionFormat).optional(),
  tokenId: z.string().optional(),
  validatorAddress: z.string().optional(),
  // FIXME The following are for staking but specific to cosmos...
  // will be reworked with the actual staking API abstraction
  sourceValidatorAddress: z.string().optional(),
  targetValidatorAddress: z.string().optional(),
  compound: z.boolean().optional(),
  // ~~

  params: cosmosTransactionParamsSchema.optional(), // For more than 1 family z.union() should be used
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
    validateAddress: z.string().optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
  }).openapi({
    // ref: "Delegate",
    title: "Delegate",
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
  }).openapi({
    // ref: "Transfer",
    title: "Transfer",
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
    tokenId: z.string(),
  }).openapi({
    // ref: "TransferToken",
    title: "TransferToken",
  }),
  z.object({
    mode: z.literal(TransactionMode.TRANSFER_TO_MANY),
    sender: z.string(),
    recipients: z.array(recipientSchema),
    fees: positiveBigintSchema.optional(),
    format: z.nativeEnum(EncodedTransactionFormat).optional(),
  }).openapi({
    // ref: "TransferToMany",
    title: "TransferToMany",
  }),
]);

const transactionDataSchema = z.object({
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

export { chainIdSchema, chainSchema, paginationSchema, plainTransactionSchema, transactionDataSchema, transactionStatusSchema };

