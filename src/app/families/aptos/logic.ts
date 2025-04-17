import {
  ChainId,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
} from "~/app/model/types_WIP";
import { fetchAccount, simulateTransaction } from "~/app/families/aptos/backend/node";

async function getTransactionFees(chainId: ChainId, transaction: TransactionData): Promise<bigint> {
  const simulationResult = await simulateTransaction(chainId, transaction);
  return BigInt(simulationResult.gas_unit_price) * BigInt(simulationResult.gas_used);
}

export async function getMaxSpendable(
  chainId: ChainId,
  transaction: TransactionData
): Promise<TransactionSpendableAmounts> {
  const estimatedFees = await getTransactionFees(chainId, transaction);
  let nativeAmount = transaction.mode === TransactionMode.TRANSFER ? (transaction.amount ?? 0n) : 0n;
  let tokenAmount =
    transaction.mode === TransactionMode.TRANSFER_TOKEN ? (transaction.amount ?? 0n) : undefined;
  return {
    native: nativeAmount - estimatedFees,
    token: tokenAmount,
  };
}

async function isAccountCreated(chainId: ChainId, address: string) {
  try {
    await fetchAccount(chainId, address);
    return true;
  } catch {
    return false;
  }
}
