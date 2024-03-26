import { ChainId, Format, PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { encodeToSign, encodeToBroadcast } from "../logic";

async function encodeTransactionToSign(
  chainId: ChainId,
  transaction: PlainTransaction,
  format?: Format
): Promise<string> {
  return encodeToSign(chainId, transaction, format ?? "hex");
}

async function encodeTransactionToBroadcast(
  chainId: ChainId,
  signedTransaction: Transaction
): Promise<string> {
  // FIXME keep string or include into Transaction's fields?...
  if (!signedTransaction.encoded) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.encoded");
  }
  if (!signedTransaction.signature) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.signature");
  }

  return encodeToBroadcast(chainId, signedTransaction);
}

export { encodeTransactionToSign, encodeTransactionToBroadcast };
