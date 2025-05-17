import {
  ChainId,
  FinalizedTransaction,
  StakingPosition,
  StakingStatus,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
  TransactionState,
} from "~/app/model/types_WIP";
import { AptosCoinIdentifier, AptosTransaction } from "~/app/families/aptos/types";
import { fetchAccountCoins, fetchStakingPositions } from "~/app/families/aptos/backend/indexer";

export async function getMaxSpendable(
  chainId: ChainId,
  transaction: TransactionData
): Promise<TransactionSpendableAmounts> {
  const estimatedFees = transaction.fees as bigint; // Populated by completeTransaction
  const nativeBalance = await fetchAccountCoins(chainId, transaction.senderAddress, AptosCoinIdentifier);
  const nativeAmount = BigInt(nativeBalance[0]?.amount) ?? 0n;
  let tokenAmount = 0n;
  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    const tokenBalance = await fetchAccountCoins(chainId, transaction.senderAddress, transaction.tokenId);
    tokenAmount = BigInt(tokenBalance[0]?.amount) ?? 0n;
  }
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

function stakingStatusByPoolType(poolType: string): StakingStatus {
  switch (poolType) {
    case "active_shares":
      return StakingStatus.LOCKED;
    case "inactive_shares":
      return StakingStatus.UNLOCKING;
    default:
      return StakingStatus.UNLOCKED;
  }
}

export async function getStakingPositions(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const positions = await fetchStakingPositions(chainId, address);
  return positions
    .filter((position) => position.shares > 0)
    .map((position) => ({
      validatorAddresses: [position.pool_address],
      amount: BigInt(Math.floor(position.shares)),
      status: stakingStatusByPoolType(position.pool_type),
    }));
}
