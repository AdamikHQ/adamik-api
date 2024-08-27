import { decode as msgpackDecode } from "algo-msgpack-with-bigint";
import { EncodedTransaction as AlgoEncodedTransaction } from "algosdk";
import { buildRawTransaction, encodeToBroadcast, encodeToSign } from "~/app/families/algorand/logic";
import { Transaction } from "~/app/model/types_WIP";
import { AlgorandService } from ".";

async function encodeTransactionToSign(this: AlgorandService, transaction: Transaction): Promise<void> {
  const rawTransaction = await buildRawTransaction(transaction.data);

  transaction.encoded = encodeToSign(rawTransaction);
}

async function encodeTransactionToBroadcast(
  this: AlgorandService,
  signedTransaction: Transaction
): Promise<string> {
  try {
    if (!signedTransaction.encoded) {
      throw new Error("missing encoded transaction");
    }
    if (!signedTransaction.signature) {
      throw new Error("missing transaction signature");
    }

    const transactionPayload = msgpackDecode(
      Buffer.from(signedTransaction.encoded, "hex")
    ) as AlgoEncodedTransaction;
    const signature = Buffer.from(signedTransaction.signature, "hex");
    const encodedTransaction = encodeToBroadcast(transactionPayload, signature);

    return encodedTransaction.toString("hex");
  } catch (e: any) {
    signedTransaction.status.errors.push({ message: `Error while encoding to broadcast: ${e.message}` });
    return "";
  }
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
