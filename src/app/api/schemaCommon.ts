import z from "zod";
import { extendZodWithOpenApi } from "zod-openapi";

import { ChainFamily, ChainId, EncodedTransactionFormat, TransactionMode } from "~/app/model/types_WIP";
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

const chainIdSchema = z
  .nativeEnum(ChainId, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: `unsupported value "${ctx.data}" encountered` };
      }
      return { message: ctx.defaultError };
    },
  })
  .openapi({
    description: "Chain ID",
    example: ChainId.ETHEREUM,
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
  params: cosmosTransactionParamsSchema.optional(), // For more than 1 family z.union() should be used
});

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

export { paginationSchema, plainTransactionSchema, transactionStatusSchema, chainIdSchema, chainSchema };
