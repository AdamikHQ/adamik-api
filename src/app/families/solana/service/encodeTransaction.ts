import { Message, Transaction as SolanaTransaction } from "@solana/web3.js";
import { encodeBase58 } from "ethers";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { createTransaction, createTransactionToken } from "../logic";
import { SolanaService } from "../service";

async function encodeTransaction(this: SolanaService, _: { transaction: Transaction; status: Status }) {
  const { transaction } = _;

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      transaction.encoded = (await createTransaction(transaction)).serializeMessage().toString("hex");
      break;
    case TransactionMode.TRANSFER_TOKEN:
      transaction.encoded = (await createTransactionToken(transaction)).serializeMessage().toString("hex");
      break;
    default:
      throw new UserInputError("Invalid transaction mode");
  }
}

async function encodeTransactionToBroadcast(
  this: SolanaService,
  _: { signedTransaction: Transaction; status: Status }
) {
  const { signedTransaction } = _;

  if (!signedTransaction.encoded) {
    throw new Error("Transaction not encoded");
  }

  if (!signedTransaction.signature) {
    throw new Error("Transaction not signed");
  }

  const recoverTransaction = SolanaTransaction.populate(
    Message.from(Buffer.from(signedTransaction.encoded, "hex")),
    [encodeBase58(Buffer.from(signedTransaction.signature, "hex"))]
  );

  return recoverTransaction.serialize().toString("hex");
}

export { encodeTransaction, encodeTransactionToBroadcast };
