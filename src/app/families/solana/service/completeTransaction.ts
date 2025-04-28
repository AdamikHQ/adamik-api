import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
import { fetchAccount, fetchAccountTokenBalance, fetchEstimatedFeeFromNode } from "../backend/node";
import {
  buildDeactivateStake,
  buildTokenTransferTransaction,
  buildTransactionStake,
  buildTransferTransaction,
  buildWithdrawStake,
} from "../logic";
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

  const fees = await calculateFees(transaction);
  if (!fees) {
    throw new InvalidTransactionError({
      errors: [{ message: "Failed to calculate fees" }],
      warnings: [],
    });
  }

  transaction.data.fees = BigInt(fees);

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

async function calculateFees(transaction: Transaction) {
  if (
    transaction.data.mode === TransactionMode.TRANSFER ||
    transaction.data.mode === TransactionMode.TRANSFER_TOKEN
  ) {
    if (!transaction.data.amount) {
      throw new UserInputError("Amount is required");
    }
  }

  let tx;
  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      tx = await buildTransferTransaction(transaction);
      break;
    case TransactionMode.TRANSFER_TOKEN:
      tx = await buildTokenTransferTransaction(transaction);
      break;
    case TransactionMode.STAKE:
      tx = await buildTransactionStake(transaction);
      break;
    case TransactionMode.UNSTAKE:
      tx = await buildDeactivateStake(transaction);
      break;
    case TransactionMode.WITHDRAW:
      tx = await buildWithdrawStake(transaction);
      break;
    default:
      throw new InvalidTransactionError({
        errors: [{ message: "Invalid transaction mode" }],
        warnings: [],
      });
  }

  const estimatedFee = await fetchEstimatedFeeFromNode(tx);
  if (!estimatedFee) {
    throw new InvalidTransactionError({
      errors: [{ message: `Failed to calculate fees for transaction mode ${transaction.data.mode}` }],
      warnings: [],
    });
  }

  return estimatedFee;
}

export { completeTransaction };
