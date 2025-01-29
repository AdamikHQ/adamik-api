import { hexToString, stringToHex } from "viem";
import { Status, Transaction } from "~/app/model/types_WIP";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { buildTransaction } from "../logic";
import { StarknetService } from "../service";
import { StarknetTransactionParams, starknetTransactionParamsPayloadSchema } from "../types";

async function encodeTransactionToSign(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const payload = await buildTransaction(transaction);

  if (!payload) {
    throw new Error("Failed to build transaction");
  }

  transaction.encoded = payload.payload.toSign;
  const params = stringToHex(
    JSON.stringify({
      mode: transaction.data.mode,
      payload: payload.payload,
      details: payload.details,
    })
  );

  transaction.data.params = params;
}

async function encodeTransactionToBroadcast(
  this: StarknetService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  const params = signedTransaction.data.params as StarknetTransactionParams;

  if (!params) {
    throw new InvalidTransactionError({
      errors: [{ message: "Transaction params are not set" }],
      warnings: [],
    });
  }

  const payload = hexToString(params as `0x${string}`);
  const decodePayload = JSON.parse(payload);
  const parsedPayload = starknetTransactionParamsPayloadSchema.parse(decodePayload);

  return JSON.stringify({
    mode: signedTransaction.data.mode,
    payload: { ...parsedPayload.payload, signature: signedTransaction.signature },
    details: { ...parsedPayload.details },
  });
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
