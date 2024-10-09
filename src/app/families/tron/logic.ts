import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { createTransaction, createTRC20TokenTransaction } from "./backend/node";

const buildTransaction = async (transaction: Transaction) => {
  const { amount, recipient, sender } = transaction.data;
  if (amount === undefined) {
    throw new Error("amount required to build raw transaction");
  }

  if (transaction.data.mode === TransactionMode.TRANSFER_TOKEN) {
    const transactionBuilded = await createTRC20TokenTransaction(
      transaction.data.tokenId,
      amount,
      recipient,
      sender
    );

    return transactionBuilded;
  }

  const transactionBuilded = await createTransaction(recipient, amount, sender);
  return transactionBuilded;
};

// How is it calculated.
// https://github.com/tronprotocol/wallet-cli/issues/292
function calculateTransactionLength(rawDateHex: string): number {
  const SIGNATURE_LENGTH = 65; // r + s + v bytes length is usally 65
  const PROTOBUF_HEADER_LENGTH = 69;

  return SIGNATURE_LENGTH + PROTOBUF_HEADER_LENGTH + Buffer.from(rawDateHex, "hex").byteLength;
}

export { buildTransaction, calculateTransactionLength };
