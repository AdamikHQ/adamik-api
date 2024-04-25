import { toHex } from "viem";
import { ChainId, Format, PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { client } from "../client";

async function encodeTransactionToSign(
  chainId: ChainId,
  transaction: PlainTransaction,
  format?: Format
): Promise<string> {
  // FIXME: Need to get maxFeePerGas and maxPriorityFeePerGas from the client.
  const { maxFeePerGas, maxPriorityFeePerGas } = await client(chainId).estimateFeesPerGas();

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
  chainId: ChainId,
  signedTransaction: Transaction
): Promise<string> {
  // FIXME keep string or include into Transaction's fields?...
  if (!signedTransaction.encoded) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.encoded");
  }
  if (!signedTransaction.signature) {
    throw new Error("encodeTransactionToBroadcast - Expected signedTransaction.signature");
  }

  return client(chainId).prepareTransactionRequest({
    account: signedTransaction.plain.senders[0] as `0x${string}`,
    to: signedTransaction.plain.recipients[0] as `0x${string}`,
    value: signedTransaction.plain.amount,
  }) as unknown as string;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };

