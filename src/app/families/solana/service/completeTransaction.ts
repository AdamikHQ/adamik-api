import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
import { fetchAccount, fetchAccountTokenBalance, fetchEstimatedFeeFromNode } from "../backend/node";
import { buildTokenTransferTransaction, buildTransferTransaction } from "../logic";
import { SolanaService } from "../service";

async function completeTransaction(
  this: SolanaService,
  { transaction }: { transaction: Transaction }
): Promise<void> {
  let balance;
  if (transaction.data.useMaxAmount) {
    const account = await fetchAccount(transaction.data.senderAddress);
    balance = account.balance;

    transaction.data.amount = BigInt(balance);
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

  if (transaction.data.useMaxAmount && balance !== undefined) {
    if (transaction.data.mode === TransactionMode.TRANSFER) {
      transaction.data.amount = balance - (transaction.data.fees ?? 0n);
    } else if (transaction.data.mode === TransactionMode.TRANSFER_TOKEN) {
      const tokenBalance = await fetchAccountTokenBalance(
        transaction.data.senderAddress,
        transaction.data.tokenId
      );

      transaction.data.amount = tokenBalance;
    }
  }

  if (transaction.data.amount && transaction.data.amount < 0n) {
    transaction.data.amount = 0n;
  }
}

async function calculateTransferTokenFees(transaction: Transaction) {
  const tx = await buildTokenTransferTransaction(transaction);

  const estimatedFee = await fetchEstimatedFeeFromNode(tx);

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

  const tx = await buildTransferTransaction(transaction);

  const estimatedFee = await fetchEstimatedFeeFromNode(tx);

  if (!estimatedFee) {
    throw new InvalidTransactionError({
      errors: [{ message: "Failed to calculate transfer fees" }],
      warnings: [],
    });
  }

  return estimatedFee;
}

export { completeTransaction };
