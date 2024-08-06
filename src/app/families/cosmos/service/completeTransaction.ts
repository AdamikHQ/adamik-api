import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { getDelegation, getEstimatedFees, resolvePubKey } from "../logic";
import { fetchAccount, fetchBalances, fetchDelegations } from "../backend/node";
import { CosmosService } from ".";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams } from "../types";
import { COSMOS_MOCK_FEES } from "../constants";

async function completeTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;

  const senderAddress = transaction.plain.senders[0];
  const account = await fetchAccount(this.chainId, senderAddress);

  const spendableBalance = await (async () => {
    switch (transaction.plain.mode) {
      case TransactionMode.TRANSFER:
      case TransactionMode.DELEGATE:
        const balances = await fetchBalances(this.chainId, senderAddress);
        const balance = balances.find((balance) => balance.denom === chainParams?.denom);
        if (!balance) {
          throw new Error(`Failed to retrieve balance for ${this.chainId} address ${senderAddress}`);
        }
        return BigInt(balance.amount);

      case TransactionMode.UNDELEGATE:
      case TransactionMode.REDELEGATE:
        const delegations = await fetchDelegations(this.chainId, senderAddress);
        const stakedBalance = getDelegation(delegations, transaction.plain);
        if (!stakedBalance) {
          throw new Error(`Failed to retrieve staking balance for ${this.chainId} address ${senderAddress}`);
        }

        return stakedBalance.amount;

      default:
        return 0n;
    }
  })();

  if (transaction.plain.useMaxAmount) {
    // Simulated amount, just for estimating fees
    // Must be: 0 > amount > max spendable, otherwise the simulation endpoint refuses to cooperate
    transaction.plain.amount = spendableBalance > COSMOS_MOCK_FEES ? spendableBalance - COSMOS_MOCK_FEES : 1n;
  }

  const { gasWanted, gasWantedFees } = await getEstimatedFees(this.chainId, account, transaction.plain);

  transaction.plain.fees = gasWantedFees;
  transaction.plain.gas = gasWanted;

  if (transaction.plain.useMaxAmount) {
    switch (transaction.plain.mode) {
      case TransactionMode.TRANSFER:
      case TransactionMode.DELEGATE:
        transaction.plain.amount = spendableBalance > gasWantedFees ? spendableBalance - gasWantedFees : 0n;
        break;

      case TransactionMode.UNDELEGATE:
      case TransactionMode.REDELEGATE:
        transaction.plain.amount = spendableBalance;
        break;
    }
  }

  const updatedAccount = resolvePubKey(account, transaction);

  transaction.plain.nonce = account.sequence;

  transaction.plain.params = {
    pubKey: updatedAccount.pubKey,
  };
}

export { completeTransaction };
