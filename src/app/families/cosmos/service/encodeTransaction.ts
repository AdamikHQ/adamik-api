import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { encodeToSign, encodeToBroadcast } from "../logic";

async function encodeTransactionToSign(transaction: PlainTransaction): Promise<string> {
  return encodeToSign(transaction);
}

async function encodeTransactionToBroadcast(signedTransaction: Transaction): Promise<string> {
  // FIXME keep string or include into Transaction's fields?...
  if (!signedTransaction.encoded) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.encoded");
  }
  if (!signedTransaction.signature) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.signature");
  }

  return encodeToBroadcast(signedTransaction);
}

export { encodeTransactionToSign, encodeTransactionToBroadcast };
