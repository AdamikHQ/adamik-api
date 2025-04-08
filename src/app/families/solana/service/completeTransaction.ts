import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
import { getEstimatedFeeFromNode } from "../backend/node";
import { createTransaction, createTransactionToken } from "../logic";

async function completeTransaction({ transaction }: { transaction: Transaction }): Promise<void> {
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
