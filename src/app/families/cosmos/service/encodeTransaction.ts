import { EncodedTransactionFormat, Transaction } from "~/app/model/types_WIP";
import { encodeToSign, encodeToBroadcast } from "../logic";
import { CosmosService } from ".";

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
      throw new Error("missing encoded transaction");
    }
    if (!signedTransaction.signature) {
      throw new Error("missing transaction signature");
    }

    return await encodeToBroadcast(this.chainId, signedTransaction);
  } catch (e: any) {
    signedTransaction.status.errors.push({ message: `Error while encoding to broadcast: ${e.message}` });
    return "";
  }
}

export { encodeTransactionToSign, encodeTransactionToBroadcast };
