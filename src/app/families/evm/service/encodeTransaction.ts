import { toHex } from "viem";
import { Format, PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { client } from "../client";
import { EvmService } from ".";

async function encodeTransactionToSign(
  this: EvmService,
  transaction: PlainTransaction,
  format?: Format
): Promise<string> {
  const { maxFeePerGas, maxPriorityFeePerGas } = await client(this.chainId).estimateFeesPerGas();

  // FIXME: Parameters needed in metamask.
  const returnValue = {
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
    maxFeePerGas: toHex(maxFeePerGas as bigint),
    value: toHex(transaction.amount),
    account: transaction.senders[0],
    from: transaction.senders[0],
    to: transaction.recipients[0],
  } as any;

  // FIXME: need probably to change prototype, string seems is not always the right type
  return returnValue;
}

async function encodeTransactionToBroadcast(
  this: EvmService,
  signedTransaction: Transaction
): Promise<string> {
  // FIXME keep string or include into Transaction's fields?...
  if (!signedTransaction.encoded) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.encoded");
  }
  if (!signedTransaction.signature) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.signature");
  }

  return client(this.chainId).prepareTransactionRequest({
    account: signedTransaction.plain.senders[0] as `0x${string}`,
    to: signedTransaction.plain.recipients[0] as `0x${string}`,
    value: signedTransaction.plain.amount,
  }) as unknown as string;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
