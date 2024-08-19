import { CompleteTransaction, EncodedTransactionFormat, Transaction } from "~/app/model/types_WIP";
import { encodeToSign, encodeToBroadcast, resolvePubKey } from "../logic";
import { CosmosService } from ".";
import { fetchAccount } from "../backend/node";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams, CosmosTransactionParams } from "../types";

async function encodeTransactionToSign(this: CosmosService, transaction: CompleteTransaction): Promise<void> {
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
  signedTransaction: CompleteTransaction
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

export { encodeTransactionToSign, encodeTransactionToBroadcast };
