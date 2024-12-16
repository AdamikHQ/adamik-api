import { CHAINS } from "~/app/config/chains";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { fetchAccount, fetchBalances, fetchDelegations } from "../backend/node";
import { COSMOS_MOCK_FEES } from "../constants";
import { getDelegation, getEstimatedFees, resolvePubKey } from "../logic";
import { CosmosService } from "../service";
import { CosmosChainParams } from "../types";

async function completeTransaction(
  this: CosmosService,
  args: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = args;

  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;

  const senderAddress = transaction.data.sender;
  const account = await fetchAccount(this.chainId, senderAddress);

  const spendableBalance = await (async () => {
    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER:
      case TransactionMode.DELEGATE:
        const balances = await fetchBalances(this.chainId, senderAddress);
        const balance = balances.find((balance) => balance.denom === chainParams?.denom);
        if (!balance) {
          status.errors.push({
            message: `No balance found for ${this.chainId} address ${senderAddress}`,
          });
          // FIXME: shouldn't we throw an error here instead?
          return 0n;
        }
        return BigInt(balance.amount);

      case TransactionMode.UNDELEGATE:
      case TransactionMode.REDELEGATE:
        const delegations = await fetchDelegations(this.chainId, senderAddress);
        const stakedBalance = getDelegation(delegations, transaction.data);
        if (!stakedBalance) {
          status.errors.push({
            message: `No staking balance found for ${this.chainId} address ${senderAddress}`,
          });
          // FIXME: shouldn't we throw an error here instead?
          return 0n;
        }

        return stakedBalance.amount;

      default:
        return 0n;
    }
  })();

  if (transaction.data.useMaxAmount) {
    // Simulated amount, just for estimating fees
    // Must be: 0 > amount > max spendable, otherwise the simulation endpoint refuses to cooperate
    transaction.data.amount = spendableBalance > COSMOS_MOCK_FEES ? spendableBalance - COSMOS_MOCK_FEES : 1n;
  }

  const { gasWanted, gasWantedFees } = await getEstimatedFees(this.chainId, account, transaction.data);

  transaction.data.fees = gasWantedFees;
  transaction.data.gas = gasWanted;

  if (transaction.data.useMaxAmount) {
    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER:
      case TransactionMode.DELEGATE:
        transaction.data.amount = spendableBalance > gasWantedFees ? spendableBalance - gasWantedFees : 0n;
        break;

      case TransactionMode.UNDELEGATE:
      case TransactionMode.REDELEGATE:
        transaction.data.amount = spendableBalance;
        break;
    }
  }

  const updatedAccount = resolvePubKey(this.chainId, account, transaction);

  transaction.data.nonce = account.sequence;
  transaction.data.params = {
    pubKey: updatedAccount.pubKey,
  };
}

export { completeTransaction };
