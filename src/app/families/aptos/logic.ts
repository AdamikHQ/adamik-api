import {
  ChainId,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
} from "~/app/model/types_WIP";
import { fetchCoinBalance, fetchNativeBalance } from "~/app/families/aptos/backend/node";
import { AptosTransaction } from "~/app/families/aptos/types";

export async function getMaxSpendable(
  chainId: ChainId,
  transaction: TransactionData
): Promise<TransactionSpendableAmounts> {
  const estimatedFees = transaction.fees as bigint; // Populated by completeTransaction
  let nativeAmount = await fetchNativeBalance(chainId, transaction.senderAddress);
  let tokenAmount =
    transaction.mode === TransactionMode.TRANSFER_TOKEN
      ? await fetchCoinBalance(chainId, transaction.senderAddress, transaction.tokenId)
      : undefined;
  return {
    native: nativeAmount - estimatedFees,
    token: tokenAmount,
  };
}

export function getTransactionMode(tx: AptosTransaction): TransactionMode | "unknown" {
  const functionName = tx.payload.function.split("::").slice(1).join("::");
  switch (functionName) {
    case "fungible_asset::transfer":
    case "primary_fungible_store::transfer":
    case "aptos_account::batch_transfer_fungible_assets":
    case "aptos_account::transfer_fungible_assets":
    case "aptos_account::transfer_coins":
      return TransactionMode.TRANSFER_TOKEN;
    case "aptos_account::transfer":
      return TransactionMode.TRANSFER;
    default:
      return "unknown";
  }
}
