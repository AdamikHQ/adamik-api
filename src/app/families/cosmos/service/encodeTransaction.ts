import { EncodedTransactionFormat, Transaction } from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { fetchAccount } from "../backend/node";
import { encodeToBroadcast, encodeToSign, resolvePubKey } from "../logic";

async function encodeTransactionToSign(this: CosmosService, transaction: Transaction): Promise<void> {
  const account = await fetchAccount(this.chainId, transaction.data.sender);

  transaction.encoded = await encodeToSign(
    this.chainId,
    account,
    transaction.data,
    transaction.data.format ?? EncodedTransactionFormat.HEX
  );
}

async function encodeTransactionToBroadcast(
  this: CosmosService,
  signedTransaction: Transaction
): Promise<string> {
  // Useless checks to make the compiler happy, Zod already validated the fields
  if (!signedTransaction.encoded) {
    throw new Error("Missing encoded transaction");
  }
  if (!signedTransaction.signature) {
    throw new Error("Missing transaction signature");
  }

  const account = await fetchAccount(this.chainId, signedTransaction.data.sender);
  const updatedAccount = resolvePubKey(account, signedTransaction);

  return await encodeToBroadcast(this.chainId, updatedAccount, signedTransaction);
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
