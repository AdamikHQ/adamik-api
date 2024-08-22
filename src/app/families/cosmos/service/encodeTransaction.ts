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
  try {
    if (!signedTransaction.encoded) {
      throw new Error("Missing encoded transaction");
    }
    if (!signedTransaction.signature) {
      throw new Error("Missing transaction signature");
    }

    const plainTransation = signedTransaction.data;

    const account = await fetchAccount(this.chainId, plainTransation.sender);
    const updatedAccount = resolvePubKey(account, signedTransaction);

    return await encodeToBroadcast(this.chainId, updatedAccount, signedTransaction);
  } catch (e: any) {
    signedTransaction.status.errors.push({ message: `Error while encoding to broadcast: ${e.message}` });
    return "";
  }
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
