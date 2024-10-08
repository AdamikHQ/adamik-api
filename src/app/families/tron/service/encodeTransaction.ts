import { Transaction } from "~/app/model/types_WIP";
import { TronService } from ".";
import { buildTransaction } from "../logic";
import { TronTransactionParams } from "../types";

async function encodeTransactionToSign(this: TronService, transaction: Transaction): Promise<void> {
  const transactionBuilded = await buildTransaction(transaction);

  transaction.encoded = transactionBuilded.raw_data_hex;
  transaction.data.params = transactionBuilded as TronTransactionParams;
}

async function encodeTransactionToBroadcast(
  this: TronService,
  signedTransaction: Transaction
): Promise<string> {
  // FIXME: Please send help :(
  return {
    ...signedTransaction.data.params,
    signature: [signedTransaction.signature],
  } as unknown as string;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
