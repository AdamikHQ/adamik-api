import { Address } from "@ton/core";
import { hexToString } from "viem";
import { Status, Transaction } from "~/app/model/types_WIP";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
import { buildTransaction, createExternalMessage, packSignatureToFront } from "../logic";
import { TonService } from "../service";
import { tonTransactionParamsPayloadSchema } from "../types";
import { initWalletV4 } from "../wallets/walletv4";

async function encodeTransactionToSign(
  this: TonService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const parsedParams = tonTransactionParamsPayloadSchema.parse(
    JSON.parse(hexToString(transaction.data.params as `0x${string}`))
  );
  const { timeout } = parsedParams;

  const builtTransaction = await buildTransaction(transaction.data, timeout);

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

  const params = signedTransaction.data.params;

  if (!params) {
    throw new InvalidTransactionError({
      errors: [{ message: "Transaction params are required" }],
      warnings: [],
    });
  }

  const decodedParams = hexToString(params as `0x${string}`);
  const parsedParams = tonTransactionParamsPayloadSchema.parse(JSON.parse(decodedParams));

  const signingMessage = await buildTransaction(signedTransaction.data, parsedParams.timeout);

  if (parsedParams.timeout < Math.floor(Date.now() / 1e3)) {
    throw new InvalidTransactionError({
      errors: [{ message: "Cannot broadcast an expired transaction" }],
      warnings: [],
    });
  }

  // Public key is mandatory when the account hasn't made a first transaction yet
  // FIXME Should be done in validateTransaction instead
  if (signedTransaction.data.nonce === BigInt(0) && !signedTransaction.data.senderPubKey) {
    throw new UserInputError("Missing wallet public key: `senderPubKey` is required");
  }

  const packSignature = packSignatureToFront(Buffer.from(signedTransaction.signature, "hex"), signingMessage);

  return createExternalMessage(
    Address.parse(signedTransaction.data.senderAddress),
    packSignature,
    signedTransaction.data.nonce === BigInt(0)
      ? initWalletV4(signedTransaction.data.senderPubKey || "")
      : undefined
  );
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
