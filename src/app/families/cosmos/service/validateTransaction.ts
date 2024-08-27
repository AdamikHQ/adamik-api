import { CHAINS } from "~/app/config/chains";
import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { prevalidateTransactionCommon } from "../../common";
import { fetchBalances, fetchDelegations } from "../backend/node";
import { getDelegation, isValidAddress } from "../logic";
import { CosmosChainParams } from "../types";

async function prevalidateTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.data, async (address: string) =>
    isValidAddress(address, this.chainId)
  );

  // Amount can't be 0 on cosmos chains
  if (transaction.data.amount === 0n) {
    transaction.status.errors.push({
      message: `Amount cannot be 0 on chain ${this.chainId}`,
    });
  }
}

async function validateTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;
  const transactionData = transaction.data;
  // amount & fees are safe to cast as they're guaranteed to be filed in by completeTransaction
  const amount = transactionData.amount as bigint;
  const fees = transactionData.fees as bigint;

  // FIXME Already called by transaction,
  // should ideally be put in some common context, or at least some cache
  const balances = await fetchBalances(this.chainId, transactionData.sender);

  const availableBalance = balances.find((balance) => balance.denom === chainParams?.denom)?.amount;

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.DELEGATE:
      // - amount + fees < nativeBalance
      if (availableBalance && amount + fees > BigInt(availableBalance)) {
        transaction.status.errors.push({ message: "Balance is too low" });
      }

      break;
    case TransactionMode.TRANSFER_TOKEN:
      const tokenBalance = balances.find((balance) => balance.denom === transactionData.tokenId)?.amount;

      // - amount < tokenBalance
      if (!tokenBalance || amount > BigInt(tokenBalance)) {
        transaction.status.errors.push({ message: "Token balance is too low" });
      }

      break;
    case TransactionMode.REDELEGATE:
    case TransactionMode.UNDELEGATE:
      // FIXME Costly to call "just" for validation, could be skipped to reduce costs
      // should ideally be put in some common context, or at least some cache
      const delegations = await fetchDelegations(this.chainId, transactionData.sender);

      const delegationBalance = getDelegation(delegations, transactionData)?.amount;

      // - amount < delegationBalance
      if (delegationBalance && amount > delegationBalance) {
        transaction.status.errors.push({ message: "Staked balance is too low" });
      }
      break;
  }

  // - fees < nativeBalance
  if (availableBalance && fees > BigInt(availableBalance)) {
    transaction.status.errors.push({ message: "Balance is too low to cover the fees" });
  }

  if (amount < fees * 10n) {
    transaction.status.warnings.push({ message: "Network fees are above 10% of the amount" });
  }
}

export { prevalidateTransaction, validateTransaction };
