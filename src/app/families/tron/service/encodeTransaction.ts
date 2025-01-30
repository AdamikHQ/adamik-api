import { Status, Transaction } from "~/app/model/types_WIP";
import { buildTransaction } from "../logic";
import { TronService } from "../service";
import { TronTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: TronService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction } = _;

  const builtTransaction = await buildTransaction(transaction);

  transaction.encoded = builtTransaction.raw_data_hex;
  transaction.data.params = { ...builtTransaction } as TronTransactionParams;
}

async function encodeTransactionToBroadcast(
  this: TronService,
  _: { signedTransaction: Transaction; status: Status }
): Promise<string> {
  const { signedTransaction } = _;

  // TODO: stringify params and encode it next time
  const params = signedTransaction.data.params as TronTransactionParams;

  return JSON.stringify({
    ...params,
    signature: [signedTransaction.signature],
  });
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
