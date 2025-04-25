import {
  ChainId,
  FinalizedTransaction,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
  TransactionState,
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

export function getAmount(tx: AptosTransaction): bigint {
  const functionName = tx.payload.function.split("::").slice(1).join("::");
  switch (functionName) {
    case "aptos_account::transfer":
    case "aptos_account::transfer_coins":
      return typeof tx.payload.arguments[1] === "string"
        ? BigInt(tx.payload.arguments[1])
        : BigInt(tx.payload.arguments[1].inner);
    case "fungible_asset::transfer":
    case "primary_fungible_store::transfer":
    case "aptos_account::batch_transfer_fungible_assets":
    case "aptos_account::transfer_fungible_assets":
      return typeof tx.payload.arguments[2] === "string"
        ? BigInt(tx.payload.arguments[2])
        : BigInt(tx.payload.arguments[2].inner);
    default:
      return 0n;
  }
}

export function getRecipient(tx: AptosTransaction): string {
  const functionName = tx.payload.function.split("::").slice(1).join("::");
  switch (functionName) {
    case "aptos_account::transfer":
    case "aptos_account::transfer_coins":
      return typeof tx.payload.arguments[1] === "string"
        ? tx.payload.arguments[1]
        : tx.payload.arguments[1].inner;
    case "fungible_asset::transfer":
    case "primary_fungible_store::transfer":
    case "aptos_account::batch_transfer_fungible_assets":
    case "aptos_account::transfer_fungible_assets":
      return typeof tx.payload.arguments[2] === "string"
        ? tx.payload.arguments[2]
        : tx.payload.arguments[2].inner;
    default:
      return "";
  }
}

export function getTicker(tx: AptosTransaction): string {
  const functionName = tx.payload.function.split("::").slice(1).join("::");
  switch (functionName) {
    case "aptos_account::transfer":
    case "aptos_account::transfer_coins":
      return "APT";
    case "fungible_asset::transfer":
    case "primary_fungible_store::transfer":
    case "aptos_account::batch_transfer_fungible_assets":
    case "aptos_account::transfer_fungible_assets":
      if (tx.payload.type_arguments === undefined) return "APT";
      return String(tx.payload.type_arguments[0].split("::").pop());
    default:
      return "";
  }
}

export function aptosToAdamikTransaction(tx: AptosTransaction): FinalizedTransaction {
  const ticker = getTicker(tx);
  return {
    parsed: {
      id: tx.hash,
      mode: getTransactionMode(tx),
      state: TransactionState.CONFIRMED,
      blockHeight: BigInt(tx.version),
      nonce: BigInt(tx.sequence_number),
      timestamp: Number(BigInt(tx.timestamp) / 1000n),
      fees: {
        amount: BigInt(tx.gas_used),
        ticker: "APT",
      },
      gas: BigInt(tx.gas_used),
      senders: [
        {
          address: tx.sender,
          amount: getAmount(tx),
          ticker,
        },
      ],
      recipients: [
        {
          address: getRecipient(tx),
          amount: getAmount(tx),
          ticker,
        },
      ],
    },
    raw: tx,
  };
}
