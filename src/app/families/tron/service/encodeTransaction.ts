import { Status, Transaction } from "~/app/model/types_WIP";
import { TronService } from ".";
import { buildTransaction } from "../logic";
import { TronTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: TronService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction } = _;

  const transactionBuilded = await buildTransaction(transaction);

  transaction.encoded = transactionBuilded.raw_data_hex;
  transaction.data.params = transactionBuilded as TronTransactionParams;
}

async function encodeTransactionToBroadcast(
  this: TronService,
  _: { signedTransaction: Transaction; status: Status }
): Promise<string> {
  const { signedTransaction } = _;

  // FIXME: Please send help :(
  return {
    ...signedTransaction.data.params,
    signature: [signedTransaction.signature],
  } as unknown as string;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
