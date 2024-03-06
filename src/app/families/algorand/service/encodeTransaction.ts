import { decode as msgpackDecode } from "algo-msgpack-with-bigint";
import { EncodedTransaction as AlgoEncodedTransaction } from "algosdk";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { buildRawTransaction, encodeToSign, encodeToBroadcast } from "~/app/families/algorand/logic";

async function encodeTransactionToSign(transaction: PlainTransaction): Promise<string> {
  const rawTransaction = await buildRawTransaction(transaction);
  const encodedTransaction = encodeToSign(rawTransaction);

  return encodedTransaction;
}

async function encodeTransactionToBroadcast(signedTransaction: Transaction): Promise<string> {
  // FIXME keep string or include into Transaction's fields?...
  if (!signedTransaction.encoded) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.encoded");
  }
  if (!signedTransaction.signature) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.signature");
  }

  const transactionPayload = msgpackDecode(
    Buffer.from(signedTransaction.encoded, "hex")
  ) as AlgoEncodedTransaction;
  const signature = Buffer.from(signedTransaction.signature, "hex");
  const encodedTransaction = encodeToBroadcast(transactionPayload, signature);

  return encodedTransaction.toString("hex");
}

export { encodeTransactionToSign, encodeTransactionToBroadcast };
