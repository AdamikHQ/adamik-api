import { ChainId, Format, PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { client } from "../client";
import { toHex } from "viem";

async function encodeTransactionToSign(
  chainId: ChainId,
  transaction: PlainTransaction,
  format?: Format
): Promise<string> {
  const signature = await client(chainId).prepareTransactionRequest({
    account: transaction.senders[0] as `0x${string}`,
    to: transaction.recipients[0] as `0x${string}`,
    value: transaction.amount,
  });

  const returnValue = {
    ...signature,
    maxPriorityFeePerGas: toHex(signature.maxPriorityFeePerGas),
    maxFeePerGas: toHex(signature.maxFeePerGas),
    gas: toHex(signature.gas),
  } as any;

  // these fields are not blockers in metamask, should test with other wallet
  delete returnValue.type;
  delete returnValue.nonce;
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

export { encodeTransactionToSign, encodeTransactionToBroadcast };
