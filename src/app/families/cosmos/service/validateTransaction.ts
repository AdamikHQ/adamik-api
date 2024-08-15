import { PlainTransaction, StakingPosition, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { getDelegation, isValidAddress } from "../logic";
import { CosmosService } from ".";
import { CosmosChainParams } from "../types";
import { CHAINS } from "~/app/config/chains";
import { fetchBalances, fetchDelegations } from "../backend/node";

async function prevalidateTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.plain, async (address: string) =>
    isValidAddress(address, this.chainId)
  );

  // Amount can't be 0 on cosmos chains
  if (transaction.plain.amount === 0n) {
    transaction.status.errors.push({
      message: `Amount cannot be 0 on chain ${this.chainId}`,
    });
  }
}

async function validateTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;
  const plainTransaction = transaction.plain;

  // FIXME Already called by completeTransaction,
  // should ideally be put in some common context, or at least some cache
  const balances = await fetchBalances(this.chainId, plainTransaction.senders[0]);

  const availableBalance = balances.find((balance) => balance.denom === chainParams?.denom)?.amount;

  switch (plainTransaction.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.DELEGATE:
      // - amount + fees < nativeBalance
      if (availableBalance && plainTransaction.amount + plainTransaction.fees > BigInt(availableBalance)) {
        transaction.status.errors.push({ message: "Balance is too low" });
      }

      break;
    case TransactionMode.TRANSFER_TOKEN:
      const tokenBalance = balances.find((balance) => balance.denom === plainTransaction.tokenId)?.amount;

      // - amount < tokenBalance
      if (!tokenBalance || plainTransaction.amount > BigInt(tokenBalance)) {
        transaction.status.errors.push({ message: "Token balance is too low" });
      }

      break;
    case TransactionMode.REDELEGATE:
    case TransactionMode.UNDELEGATE:
      // FIXME Costly to call "just" for validation, could be skipped to reduce costs
      // should ideally be put in some common context, or at least some cache
      const delegations = await fetchDelegations(this.chainId, plainTransaction.senders[0]);

      const delegationBalance = getDelegation(delegations, plainTransaction)?.amount;

      // - amount < delegationBalance
      if (delegationBalance && plainTransaction.amount > delegationBalance) {
        transaction.status.errors.push({ message: "Staked balance is too low" });
      }
      break;
  }

  // - fees < nativeBalance
  if (availableBalance && plainTransaction.fees > BigInt(availableBalance)) {
    transaction.status.errors.push({ message: "Balance is too low to cover the fees" });
  }

  if (plainTransaction.amount < plainTransaction.fees * 10n) {
    transaction.status.warnings.push({ message: "Network fees are above 10% of the amount" });
  }
}

export { prevalidateTransaction, validateTransaction };
