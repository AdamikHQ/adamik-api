import { Transaction } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
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
  // useless check to make the compiler happy, zod already validated the fields
  if (signedTransaction.signature === undefined) {
    throw new Error("Missing transaction signature");
  }

  const signingMessage = await buildTransaction(signedTransaction.data);

  const transactionParams = signedTransaction.data?.params as TonTransactionParams;

  // Public key is mandatory when the account hasn't made a first transaction yet
  if (signedTransaction.data.nonce === BigInt(0) && !transactionParams?.pubKey) {
    throw new UserInputError("Missing wallet public key: `params.pubKey` is required");
  }

  const packSignature = packSignatureToFront(Buffer.from(signedTransaction.signature, "hex"), signingMessage);

  return createExternalMessage(
    signedTransaction.data.sender,
    packSignature,
    initWalletV4(transactionParams?.pubKey || "")
  );
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
