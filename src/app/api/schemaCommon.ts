import z from "zod";
import {
  ChainFamily,
  ChainFeature,
  ChainId,
  EncodedTransactionFormat,
  TransactionMode,
  TokenType,
} from "~/app/model/types_WIP";
import { cosmosTransactionParamsSchema } from "../families/cosmos/types";

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

const tokenSchema = z.object({
  chainId: z.string(),
  type: z.nativeEnum(TokenType),
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.number(),
  contractAddress: z.string().optional(),
});

export {
  paginationSchema,
  plainTransactionSchema,
  transactionStatusSchema,
  chainIdSchema,
  chainSchema,
  tokenSchema,
};
