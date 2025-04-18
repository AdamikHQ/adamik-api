import {
  ChainId,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
} from "~/app/model/types_WIP";
import {
  fetchAccount,
  fetchCoinBalance,
  fetchNativeBalance,
  simulateTransaction,
} from "~/app/families/aptos/backend/node";
import { AptosTransactionParams } from "~/app/families/aptos/types";

async function getTransactionFees(chainId: ChainId, transaction: TransactionData): Promise<bigint> {
  const simulationResult = await simulateTransaction(chainId, transaction);
  return BigInt(simulationResult.gas_unit_price) * BigInt(simulationResult.gas_used);
}

export async function getMaxSpendable(
  chainId: ChainId,
  transaction: TransactionData
): Promise<TransactionSpendableAmounts> {
  const estimatedFees = await getTransactionFees(chainId, transaction);
  let nativeAmount = await fetchNativeBalance(chainId, transaction.senderAddress);
  let tokenAmount =
    transaction.mode === TransactionMode.TRANSFER_TOKEN
      ? await fetchCoinBalance(
          chainId,
          transaction.senderAddress,
          (transaction.params as AptosTransactionParams).payload.type_arguments![0]
        )
      : undefined;
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

export async function buildTransaction(transaction: TransactionData) {
  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
      break;
    case TransactionMode.TRANSFER_TOKEN:
      break;
    default:
      throw new Error("");
  }
}
