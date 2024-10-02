import { Transaction } from "~/app/model/types_WIP";
import { TronService } from ".";
import { createTransaction } from "../backend/node";

async function encodeTransactionToSign(this: TronService, transaction: Transaction): Promise<void> {
  const { amount, recipient, sender } = transaction.data;
  if (amount === undefined) {
    throw new Error("amount required to build raw transaction");
  }

  const transactionBuilded = await createTransaction(recipient, amount, sender);

  transaction.encoded = transactionBuilded.raw_data_hex;
}

async function encodeTransactionToBroadcast(
  this: TronService,
  signedTransaction: Transaction
): Promise<string> {
  const { amount, recipient, sender } = signedTransaction.data;
  if (amount === undefined) {
    throw new Error("amount required to build raw transaction");
  }
  const transactionBuilded = await createTransaction(recipient, amount, sender);

  // FIXME: Please send help (
  return {
    ...transactionBuilded,
    signature: [signedTransaction.signature],
  } as unknown as string;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
