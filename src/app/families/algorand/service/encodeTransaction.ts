import { Transaction as AlgoTransaction, decodeMsgpack } from "algosdk";
import { buildRawTransaction, encodeToBroadcast, encodeToSign } from "~/app/families/algorand/logic";
import { EncodedTransactionFormat, Status, Transaction } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
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

  const encodedTransaction = signedTransaction.encoded.find((encoded) => {
    return encoded.format === EncodedTransactionFormat.ALGORAND_MSGPACK;
  });

  if (!encodedTransaction) {
    throw new UserInputError("Missing encoded transaction");
  }

  const transactionPayload = decodeMsgpack(Buffer.from(encodedTransaction.value, "hex"), AlgoTransaction);

  const signature = Buffer.from(signedTransaction.signature, "hex");

  const broadcastPayload = encodeToBroadcast(transactionPayload, signature);
  return broadcastPayload.toString("hex");
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
