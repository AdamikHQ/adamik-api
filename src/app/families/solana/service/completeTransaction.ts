import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
import { getEstimatedFeeFromNode } from "../backend/node";
import { createTransaction, createTransactionToken } from "../logic";
import { SolanaService } from "../service";

async function completeTransaction(
  this: SolanaService,
  { transaction }: { transaction: Transaction }
): Promise<void> {
  let account;
  if (transaction.data.useMaxAmount) {
    account = await this.getAccountState(transaction.data.senderAddress);

    transaction.data.amount = account.balances?.native?.available ?? 0n;
  }

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      const transferFee = await calculateTransferFees(transaction);
      if (!transferFee) {
        throw new InvalidTransactionError({
          errors: [{ message: "Failed to calculate transfer fees" }],
          warnings: [],
        });
      }

      transaction.data.fees = BigInt(transferFee);
      break;

    case TransactionMode.TRANSFER_TOKEN:
      if (!transaction.data.amount) {
        throw new UserInputError("Amount is required");
      }
      const transferTokenFees = await calculateTransferTokenFees(transaction);
      if (!transferTokenFees) {
        throw new InvalidTransactionError({
          errors: [{ message: "Failed to calculate transfer fees" }],
          warnings: [],
        });
      }

      transaction.data.fees = BigInt(transferTokenFees);
      break;

    default:
      break;
  }

  if (transaction.data.useMaxAmount && account) {
    if (transaction.data.mode === TransactionMode.TRANSFER) {
      transaction.data.amount = (account.balances?.native?.available ?? 0n) - (transaction.data.fees ?? 0n);
    } else if (transaction.data.mode === TransactionMode.TRANSFER_TOKEN) {
      transaction.data.amount =
        account.balances?.tokens?.find(
          (token) =>
            transaction.data.mode === TransactionMode.TRANSFER_TOKEN &&
            token.token.id === transaction.data.tokenId
        )?.amount ?? 0n;
    }
  }
}

async function calculateTransferTokenFees(transaction: Transaction) {
  const tx = await createTransactionToken(transaction);

  const estimatedFee = await getEstimatedFeeFromNode(tx);

  if (!estimatedFee) {
    throw new InvalidTransactionError({
      errors: [{ message: "Failed to calculate transfer fees" }],
      warnings: [],
    });
  }

  return estimatedFee;
}

async function calculateTransferFees(transaction: Transaction) {
  if (!transaction.data.amount) {
    throw new UserInputError("Amount is required");
  }

  const tx = await createTransaction(transaction);

  const estimatedFee = await getEstimatedFeeFromNode(tx);

  if (!estimatedFee) {
    throw new InvalidTransactionError({
      errors: [{ message: "Failed to calculate transfer fees" }],
      warnings: [],
    });
  }

  return estimatedFee;
}

export { completeTransaction };
