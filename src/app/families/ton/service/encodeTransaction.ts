import { Address } from "@ton/core";
import { EncodedTransactionFormat, HashFunction, Status, Transaction } from "~/app/model/types_WIP";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
import { buildTransaction, createExternalMessageBOC } from "../logic";
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

  const builtTransaction = (await buildTransaction(transaction.data, timeout)).endCell();

  transaction.encoded = [
    {
      raw: {
        format: EncodedTransactionFormat.BOC, // https://docs.ton.org/v3/documentation/data-formats/tlb/cell-boc#bag-of-cells
        value: builtTransaction.toBoc().toString("hex"),
      },
      hash: {
        format: HashFunction.SHA256, // https://docs.ton.org/v3/documentation/data-formats/tlb/cell-boc#standard-cell-representation-hash-calculation
        value: builtTransaction.hash().toString("hex"),
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

  if (!signedTransaction.encoded?.length || !signedTransaction.encoded[0].raw?.value) {
    throw new UserInputError("Missing encoded transaction");
  }

  if (!signedTransaction.data.params) {
    throw new UserInputError("Missing transaction.data.params");
  }

  const { timeout } = tonTransactionParamsSchema.parse(signedTransaction.data.params);

  if (timeout < Math.floor(Date.now() / 1e3)) {
    throw new InvalidTransactionError({
      errors: [{ message: "Cannot broadcast an expired transaction" }],
      warnings: [],
    });
  }

  // NOTE Impossible to use the existing encoded from the tx because
  // it's already in BOC format, and we need the Builder object...
  const messageToSign = await buildTransaction(signedTransaction.data, timeout);

  return createExternalMessageBOC(
    Address.parse(signedTransaction.data.senderAddress),
    messageToSign,
    Buffer.from(signedTransaction.signature, "hex"),
    signedTransaction.data.nonce === 0n ? initWalletV4(signedTransaction.data.senderPubKey || "") : undefined
  );
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
