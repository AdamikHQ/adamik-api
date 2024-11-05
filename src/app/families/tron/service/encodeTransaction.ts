import { Status, Transaction } from "~/app/model/types_WIP";
import { buildTransaction } from "../logic";
import { TronService } from "../service";
import { TronTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: TronService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction } = _;

  const transactionBuilt = await buildTransaction(transaction);

  transaction.encoded = transactionBuilt.raw_data_hex;
  transaction.data.params = { ...transactionBuilt } as TronTransactionParams;
}

async function encodeTransactionToBroadcast(
  this: TronService,
  _: { signedTransaction: Transaction; status: Status }
): Promise<string> {
  const { signedTransaction } = _;

  return JSON.stringify({
    ...signedTransaction.data.params,
    signature: [signedTransaction.signature],
  });
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
