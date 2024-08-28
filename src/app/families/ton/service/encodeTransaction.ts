import { Transaction } from "~/app/model/types_WIP";
import { TonService } from ".";
import { buildTransaction, createExternalMessage, packSignatureToFront } from "../logic";
import { TonTransactionParams } from "../types";
import { initWalletV4 } from "../wallets/walletv4";

async function encodeTransactionToSign(this: TonService, transaction: Transaction): Promise<void> {
  const buildedTransaction = await buildTransaction(transaction.data);

  transaction.encoded = buildedTransaction.endCell().hash().toString("hex");
}

async function encodeTransactionToBroadcast(
  this: TonService,
  signedTransaction: Transaction
): Promise<string> {
  const signingMessage = await buildTransaction(signedTransaction.data);

  if (signedTransaction.signature === undefined) {
    throw new Error("Missing transaction signature");
  }

  const transactionParams = signedTransaction.data.params as TonTransactionParams;

  if (signedTransaction.data.nonce && signedTransaction.data.nonce === BigInt(0) && transactionParams && !transactionParams.pubKey) {
    throw new Error("Missing wallet public key");
  }

  const packSignature = packSignatureToFront(Buffer.from(signedTransaction.signature, "hex"), signingMessage);
  return createExternalMessage(signedTransaction.data.sender, packSignature, initWalletV4(transactionParams!.pubKey || ""));
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };

