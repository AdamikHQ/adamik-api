import {
  ChainId,
  PlainTransaction,
  Transaction,
  TransactionMode,
  TransactionSpendableAmounts,
  TransactionStatus,
} from "~/app/model/types_WIP";
import { estimateFeesPerGas } from "../backend/node";
import { getTransactionFees, getTransactionAmount, getTransactionGas, getMaxSpendable } from "../logic";
import { EvmService } from ".";
import { BaseError as ViemError } from "viem";

async function completeTransaction(this: EvmService, transaction: PlainTransaction): Promise<Transaction> {
  const status: TransactionStatus = { errors: [], warnings: [] };

  // Completion
  const completedTransaction: PlainTransaction = await (async () => {
    try {
      switch (transaction.mode) {
        case TransactionMode.TRANSFER:
          return await completeNativeTransaction(this.chainId, transaction);
        case TransactionMode.TRANSFER_TOKEN:
          return await completeTokenTransaction(this.chainId, transaction);
        default:
          throw new Error(
            `Unsupported transaction mode ${transaction.mode} for chain ID ${transaction.chainId}`
          );
      }
    } catch (e: any) {
      const message =
        e instanceof ViemError ? e.shortMessage : e.message || "Failed to complete the transaction";
      status.errors.push({ message });
      return transaction;
    }
  })();

  if (status.errors.length) {
    return { plain: completedTransaction, status };
  }

  // Validation
  const maxSpendable = await getMaxSpendable(this.chainId, transaction);

  await validateTransaction(transaction, maxSpendable, status);

  return { plain: completedTransaction, status };
}

// FIXME input 'transaction' is mutated, maybe not a good pattern since it's coming from the API request
async function completeNativeTransaction(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  const { maxFeePerGas } = await estimateFeesPerGas(chainId);
  if (maxFeePerGas === undefined) {
    throw new Error("Could not retrieve maxFeePerGas");
  }

  // Since a gas estimation is done by simulating the transaction,
  // we can't know in advance how much we should put in the simulation.
  // But as a native transaction (no smart contract) should always consume the same amount of gas,
  // no matter the amount of coin transfered, we can infer the gas with any amount
  transaction.gas = await getTransactionGas(chainId, transaction);

  transaction.fees = await getTransactionFees(chainId, transaction, maxFeePerGas);

  transaction.amount = await getTransactionAmount(chainId, transaction);

  return transaction;
}

// FIXME input 'transaction' is mutated, maybe not a good pattern since it's coming from the API request
async function completeTokenTransaction(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  const { maxFeePerGas } = await estimateFeesPerGas(chainId);
  if (maxFeePerGas === undefined) {
    throw new Error("Could not retrieve maxFeePerGas");
  }

  transaction.amount = await getTransactionAmount(chainId, transaction);

  transaction.gas = await getTransactionGas(chainId, transaction);

  transaction.fees = await getTransactionFees(chainId, transaction, maxFeePerGas);

  return transaction;
}

// NOTE input 'status' is mutated (more or less fine since it's local to this file...)
async function validateTransaction(
  transaction: PlainTransaction,
  maxSpendable: TransactionSpendableAmounts,
  status: TransactionStatus
): Promise<void> {
  switch (transaction.mode) {
    case TransactionMode.TRANSFER: {
      if (transaction.amount + transaction.fees > maxSpendable.native) {
        status.errors.push({ message: "Balance is too low" });
      } else if (transaction.amount < transaction.fees * 10n) {
        status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (transaction.fees > maxSpendable.native) {
        status.errors.push({ message: "Balance is too low" });
      }
      if (maxSpendable.token && transaction.amount > maxSpendable.token) {
        status.errors.push({ message: "Token balance is too low" });
      }

      break;
    }
  }
}

export { completeTransaction };
