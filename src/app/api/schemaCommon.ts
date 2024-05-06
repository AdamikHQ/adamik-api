import z from "zod";
import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { ChainId } from "~/app/model/types_WIP";

const chainIdSchema = z.nativeEnum(ChainId);

const transactionModeSchema = z.union([z.literal("transfer"), z.literal("optIn"), z.literal("claimReward")]);

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
  format: z.string().optional(), // FIXME should not be here
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

const plainTransactionSchema = z.object({
  chainId: chainIdSchema,
  mode: transactionModeSchema,
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  // TODO should be only one of [amount, useMaxAmount]
  amount: z.string().optional(),
  useMaxAmount: z.boolean().optional(),
  fees: z.string().optional(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  memo: z.string().optional(),
  format: z.string().optional(), // FIXME should not be here
});

const errorMsgSchema = z.object({
  message: z.string(),
});

const transactionStatusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
});

const unitSchema = z.object({
  name: z.string(),
  code: z.string(),
  decimals: z.number(),
});

const backendsSchema = z.object({
  nodeURL: z.string(),
  explorerURL: z.string().optional(),
});

function handleRequestValidationError(e: unknown): NextResponse {
  if (e instanceof ZodError) {
    return NextResponse.json(
      { message: "invalid request", errors: e.errors },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }
  throw e;
}

export {
  chainIdSchema,
  unitSchema,
  backendsSchema,
  plainTransactionSchema,
  transactionStatusSchema,
  handleRequestValidationError,
};
