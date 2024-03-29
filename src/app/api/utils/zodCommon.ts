import z from "zod";
import { ChainId } from "~/app/model/types_WIP";

const chainIdSchema = z.nativeEnum(ChainId);

const transactionModeSchema = z.union([z.literal("transfer"), z.literal("optIn"), z.literal("claimReward")]);

const errorMsgSchema = z.object({
  message: z.string(),
});

export const plainTransactionSchema = z.object({
  chainId: chainIdSchema,
  mode: transactionModeSchema,
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  amount: z.string(),
  useMaxAmount: z.boolean(),
  fees: z.string().optional(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  memo: z.string().optional(),
  format: z.string().optional(),
});

export const transactionStatusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
});

export const transactionSchema = z.object({
  plain: plainTransactionSchema,
  encoded: z.string().optional(),
  signature: z.string().optional(),
  status: transactionStatusSchema.optional(),
});

export const unitSchema = z.object({
  name: z.string(),
  code: z.string(),
  decimals: z.number(),
});

const backendsSchema = z.object({
  nodeURL: z.string(),
  explorerURL: z.string().optional(),
});

export const chainSchema = z.object({
  id: chainIdSchema,
  name: z.string(),
  family: z.string(),
  units: z.array(unitSchema),
  backends: backendsSchema,
  params: z.any().optional(),
});
