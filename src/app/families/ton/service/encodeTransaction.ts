import { Transaction } from "~/app/model/types_WIP";
import { TonService } from ".";
import { buildTransaction, createExternalMessage, packSignatureToFront } from "../logic";
import { TonTransactionParams } from "../types";
import { initWalletV4 } from "../wallets/walletv4";

async function encodeTransactionToSign(this: TonService, transaction: Transaction): Promise<void> {
  const builtTransaction = await buildTransaction(transaction.data);

  transaction.encoded = builtTransaction.endCell().hash().toString("hex");
}

async function encodeTransactionToBroadcast(
  this: TonService,
  signedTransaction: Transaction
): Promise<string> {
  try {
    const signingMessage = await buildTransaction(signedTransaction.data);

    if (signedTransaction.signature === undefined) {
      throw new Error("Missing transaction signature");
    }

    const transactionParams = signedTransaction.data?.params as TonTransactionParams;

    // FIXME Unclear: is the pubKey always required? Or only in some cases?
    if (signedTransaction.data.nonce === BigInt(0) && !transactionParams?.pubKey) {
      throw new Error("Missing wallet public key");
    }

    const packSignature = packSignatureToFront(
      Buffer.from(signedTransaction.signature, "hex"),
      signingMessage
    );

    return createExternalMessage(
      signedTransaction.data.sender,
      packSignature,
      initWalletV4(transactionParams?.pubKey || "")
    );
  } catch (e: any) {
    signedTransaction.status.errors.push({ message: `Error while encoding to broadcast: ${e.message}` });
    return "";
  }
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
