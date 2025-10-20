import { ChainId, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { fetchAccountTokenBalance, fetchEstimatedFeeFromNode, fetchNativeBalance } from "../backend/node";
import {
  buildDeactivateStakeTransaction,
  buildStakeTransaction,
  buildTokenTransferTransaction,
  buildTransferTransaction,
  buildWithdrawStakeTransaction,
} from "../logic";
import { SolanaService } from "../service";

async function completeTransaction(
  this: SolanaService,
  { transaction }: { transaction: Transaction }
): Promise<void> {
  let balance;
  if (transaction.data.useMaxAmount) {
    const nativeBalanceData = await fetchNativeBalance(this.chainId, transaction.data.senderAddress);
    balance = nativeBalanceData.balance;

    transaction.data.amount = BigInt(balance);
  }

  transaction.data.fees = BigInt(await calculateFees(this.chainId, transaction));

  if (transaction.data.useMaxAmount && balance !== undefined) {
    if (transaction.data.mode === TransactionMode.TRANSFER) {
      transaction.data.amount = balance - (transaction.data.fees ?? 0n);
    } else if (transaction.data.mode === TransactionMode.TRANSFER_TOKEN) {
      const tokenBalance = await fetchAccountTokenBalance(
        this.chainId,
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

async function calculateFees(chainId: ChainId, transaction: Transaction) {
  let tx;
  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      tx = await buildTransferTransaction(chainId, transaction);
      break;
    case TransactionMode.TRANSFER_TOKEN:
      tx = await buildTokenTransferTransaction(chainId, transaction);
      break;
    case TransactionMode.STAKE:
      tx = await buildStakeTransaction(chainId, transaction);
      break;
    case TransactionMode.UNSTAKE:
      tx = await buildDeactivateStakeTransaction(chainId, transaction);
      break;
    case TransactionMode.WITHDRAW:
      tx = await buildWithdrawStakeTransaction(chainId, transaction);
      break;
    default:
      throw new InvalidTransactionError({
        errors: [{ message: "Invalid transaction mode" }],
        warnings: [],
      });
  }

  const estimatedFee = await fetchEstimatedFeeFromNode(chainId, tx);
  if (estimatedFee === null) {
    throw new InvalidTransactionError({
      errors: [{ message: `Failed to calculate fees for transaction mode ${transaction.data.mode}` }],
      warnings: [],
    });
  }

  return estimatedFee;
}

export { completeTransaction };
