import { decode as msgpackDecode } from "algo-msgpack-with-bigint";
import { EncodedTransaction as AlgoEncodedTransaction } from "algosdk";
import { buildRawTransaction, encodeToBroadcast, encodeToSign } from "~/app/families/algorand/logic";
import { Status, Transaction } from "~/app/model/types_WIP";
import { AlgorandService } from "../service";

async function encodeTransactionToSign(
  this: AlgorandService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const rawTransaction = await buildRawTransaction(transaction.data);

  transaction.encoded = encodeToSign(rawTransaction);
}

async function encodeTransactionToBroadcast(
  this: AlgorandService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  // Useless checks to make the compiler happy, Zod already validated the fields
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
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
