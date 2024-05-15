import { Format, PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { encodeToSign, encodeToBroadcast } from "../logic";
import { CosmosService } from ".";

async function encodeTransactionToSign(
  this: CosmosService,
  transaction: PlainTransaction,
  format?: Format
): Promise<string> {
  return encodeToSign(this.chainId, transaction, format ?? "hex");
}

async function encodeTransactionToBroadcast(
  this: CosmosService,
  signedTransaction: Transaction
): Promise<string> {
  // FIXME keep string or include into Transaction's fields?...
  if (!signedTransaction.encoded) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.encoded");
  }
  if (!signedTransaction.signature) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.signature");
  }

  return encodeToBroadcast(this.chainId, signedTransaction);
}

export { encodeTransactionToSign, encodeTransactionToBroadcast };
