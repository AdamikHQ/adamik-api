import { hexToString, stringToHex } from "viem";
import { Status, Transaction } from "~/app/model/types_WIP";
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

  transaction.data.params = { payload: params };
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
  if (!params.payload) {
    throw new Error("Transaction params are not set");
  }

  const payload = hexToString(params.payload as `0x${string}`);
  const decodePayload = JSON.parse(payload);
  const parsedPayload = starknetTransactionParamsPayloadSchema.parse(decodePayload);

  return JSON.stringify({
    mode: signedTransaction.data.mode,
    payload: { ...parsedPayload, signature: signedTransaction.signature },
    details: { ...parsedPayload.details },
  });
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
