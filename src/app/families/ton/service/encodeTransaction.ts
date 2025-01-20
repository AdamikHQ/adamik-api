import { Status, Transaction } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { buildTransaction, createExternalMessage, packSignatureToFront } from "../logic";
import { TonService } from "../service";
import { initWalletV4 } from "../wallets/walletv4";

async function encodeTransactionToSign(
  this: TonService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const builtTransaction = await buildTransaction(transaction.data);

  transaction.encoded = builtTransaction.endCell().hash().toString("hex");
}

async function encodeTransactionToBroadcast(
  this: TonService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  // useless check to make the compiler happy, zod already validated the fields
  if (signedTransaction.signature === undefined) {
    throw new Error("Missing transaction signature");
  }

  const signingMessage = await buildTransaction(signedTransaction.data);

  // Public key is mandatory when the account hasn't made a first transaction yet
  // FIXME Should be done in validateTransaction instead
  if (signedTransaction.data.nonce === BigInt(0) && !signedTransaction.data.senderPubKey) {
    throw new UserInputError("Missing wallet public key: `senderPubKey` is required");
  }

  const packSignature = packSignatureToFront(Buffer.from(signedTransaction.signature, "hex"), signingMessage);

  return createExternalMessage(
    signedTransaction.data.senderAddress,
    packSignature,
    initWalletV4(signedTransaction.data.senderPubKey || "")
  );
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
