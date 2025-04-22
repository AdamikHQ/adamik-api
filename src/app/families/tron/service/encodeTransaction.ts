import { EncodedTransactionFormat, Status, Transaction } from "~/app/model/types_WIP";
import { sha256 } from "~/app/tools/hash";
import { buildTransaction } from "../logic";
import { TronService } from "../service";
import { TronTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: TronService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction } = _;

  const builtTransaction = await buildTransaction(transaction);

  transaction.encoded = [
    {
      raw: {
        format: EncodedTransactionFormat.RAW_TRANSACTION,
        value: builtTransaction.raw_data_hex,
      },
      hash: {
        format: EncodedTransactionFormat.HASH_SHA256,
        value: sha256(Buffer.from(builtTransaction.raw_data_hex, "hex")),
      },
    },
  ];
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
