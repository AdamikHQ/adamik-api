import { EncodedTransactionFormat, Transaction } from "~/app/model/types_WIP";
import { encodeToSign, encodeToBroadcast } from "../logic";
import { CosmosService } from ".";
import { fetchAccount } from "../backend/node";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams, CosmosTransactionParams } from "../types";

async function encodeTransactionToSign(this: CosmosService, transaction: Transaction): Promise<void> {
  transaction.encoded = await encodeToSign(
    this.chainId,
    transaction.plain,
    transaction.plain.format ?? EncodedTransactionFormat.HEX
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

    const plainTransation = signedTransaction.plain;

    const chainParams = CHAINS[this.chainId].params as CosmosChainParams;
    const transactionParams = signedTransaction.plain.params as CosmosTransactionParams;

    const account = await fetchAccount(this.chainId, plainTransation.senders[0]);

    const pubKeyType = account.pubKeyType || chainParams.defaultPubKeyType;
    const pubKey = account.pubKey || transactionParams?.pubKey;
    if (!pubKey) {
      signedTransaction.status.errors.push({
        message: "Public key of the sender address not found on the blockchain, it must be provided manually",
      });
      return "";
    }

    return await encodeToBroadcast(this.chainId, signedTransaction, pubKeyType, pubKey);
  } catch (e: any) {
    signedTransaction.status.errors.push({ message: `Error while encoding to broadcast: ${e.message}` });
    return "";
  }
}

export { encodeTransactionToSign, encodeTransactionToBroadcast };
