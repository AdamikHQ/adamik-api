import { Status, Transaction } from "~/app/model/types_WIP";
import { buildTransaction } from "../logic";
import { StarknetService } from "../service";
import { StarknetTransactionParams } from "../types";

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
  transaction.data.params = {
    payload: payload.payload,
    details: payload.details,
  } as StarknetTransactionParams;
}

async function encodeTransactionToBroadcast(
  this: StarknetService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  if (!signedTransaction.data.params) {
    throw new Error("Transaction params are not set");
  }

  const params = signedTransaction.data.params as StarknetTransactionParams;

  return JSON.stringify({
    mode: signedTransaction.data.mode,
    payload: { ...params.payload, signature: signedTransaction.signature },
    details: { ...params.details },
  });
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
