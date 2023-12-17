import { decode as msgpackDecode } from "algo-msgpack-with-bigint";
import { EncodedTransaction as AlgoEncodedTransaction } from "algosdk";
import { Transaction } from "~/app/model/types_WIP";
import { encodeToBroadcast } from "~/app/chains/algorand/logic";

async function encodeTransactionToBroadcast(
  signedTransaction: Transaction
): Promise<string> {
  // FIXME keep string or include into Transaction's fields?...
  if (!signedTransaction.encoded) {
    throw new Error(
      "encodeTransactionToBroadcast - Expected signedTransaction.encoded"
    );
  }
  if (!signedTransaction.signature) {
    throw new Error(
      "encodeTransactionToBroadcast - Expected signedTransaction.encoded"
    );
  }

  // FIXME Does this work ? Is it safe ?
  // (alternative: build again from transaction.plain)
  const transactionPayload = msgpackDecode(
    Buffer.from(signedTransaction.encoded, "hex")
  ) as AlgoEncodedTransaction;
  const signature = Buffer.from(signedTransaction.signature, "hex");
  const encodedTransaction = encodeToBroadcast(transactionPayload, signature);

  return encodedTransaction.toString("hex");
}

export { encodeTransactionToBroadcast };
