import { Address } from "@ton/core";
import {
  EncodedTransactionFormat,
  HashFunction,
  Status,
  Transaction,
  TransactionMode,
} from "~/app/model/types_WIP";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
import { buildTransaction, createExternalMessage, packSignatureToFront } from "../logic";
import { TonService } from "../service";
import { tonTransactionParamsSchema } from "../types";
import { initWalletV4 } from "../wallets/walletv4";

async function encodeTransactionToSign(
  this: TonService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const { timeout } = tonTransactionParamsSchema.parse(transaction.data.params);

  const builtTransaction = await buildTransaction(transaction.data, timeout);

  transaction.encoded = [
    {
      raw: {
        format: EncodedTransactionFormat.BOC, // https://docs.ton.org/v3/documentation/data-formats/tlb/cell-boc#bag-of-cells
        value: builtTransaction.endCell().toBoc().toString("hex"),
      },
      hash: {
        format: HashFunction.SHA256, // https://docs.ton.org/v3/documentation/data-formats/tlb/cell-boc#standard-cell-representation-hash-calculation
        value: builtTransaction.endCell().hash().toString("hex"),
      },
    },
  ];
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
    throw new UserInputError("Missing transaction signature");
  }

  if (!signedTransaction.data.params) {
    throw new InvalidTransactionError({
      errors: [{ message: "Transaction params are required" }],
      warnings: [],
    });
  }

  const { timeout } = tonTransactionParamsSchema.parse(signedTransaction.data.params);

  const signingMessage = await buildTransaction(signedTransaction.data, timeout);

  if (timeout < Math.floor(Date.now() / 1e3)) {
    throw new InvalidTransactionError({
      errors: [{ message: "Cannot broadcast an expired transaction" }],
      warnings: [],
    });
  }

  // Public key is mandatory when the account hasn't made a first transaction yet
  if (
    signedTransaction.data.mode === TransactionMode.TRANSFER &&
    signedTransaction.data.nonce === 0n &&
    !signedTransaction.data.senderPubKey
  ) {
    throw new UserInputError("Missing wallet public key: `senderPubKey` is required");
  }

  const packSignature = packSignatureToFront(Buffer.from(signedTransaction.signature, "hex"), signingMessage);

  return createExternalMessage(
    Address.parse(signedTransaction.data.senderAddress),
    packSignature,
    signedTransaction.data.nonce === 0n ? initWalletV4(signedTransaction.data.senderPubKey!) : undefined
  );
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
