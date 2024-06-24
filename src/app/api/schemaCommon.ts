import z from "zod";
import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { ChainFamily, ChainId, EncodedTransactionFormat, TransactionMode } from "~/app/model/types_WIP";

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

const plainTransactionSchema = z.object({
  chainId: z.nativeEnum(ChainId),
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

const errorMsgSchema = z.object({
  message: z.string(),
});

const transactionStatusSchema = z.object({
  errors: z.array(errorMsgSchema),
  warnings: z.array(errorMsgSchema),
});

const chainSchema = z.object({
  id: z.nativeEnum(ChainId),
  name: z.string(),
  family: z.nativeEnum(ChainFamily),
  isTestnet: z.boolean().optional(),
  params: z.any().optional(),
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

export { plainTransactionSchema, transactionStatusSchema, handleRequestValidationError, chainSchema };
