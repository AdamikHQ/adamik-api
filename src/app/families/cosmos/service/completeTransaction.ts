import { CompleteTransaction, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { getDelegation, getEstimatedFees, resolvePubKey } from "../logic";
import { fetchAccount, fetchBalances, fetchDelegations } from "../backend/node";
import { CosmosService } from ".";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams } from "../types";
import { COSMOS_MOCK_FEES } from "../constants";
import { bigint } from "zod";

async function completeTransaction(
  this: CosmosService,
  transaction: Transaction
): Promise<CompleteTransaction> {
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
          throw new Error(`Failed to retrieve balance for ${this.chainId} address ${senderAddress}`);
        }
        return BigInt(balance.amount);

      case TransactionMode.UNDELEGATE:
      case TransactionMode.REDELEGATE:
        const delegations = await fetchDelegations(this.chainId, senderAddress);
        const stakedBalance = getDelegation(delegations, transaction.data);
        if (!stakedBalance) {
          throw new Error(`Failed to retrieve staking balance for ${this.chainId} address ${senderAddress}`);
        }

        return stakedBalance.amount;

      default:
        return 0n;
    }
  })();

  let amount = transaction.data.recipients[0].amount;

  if (transaction.data.useMaxAmount) {
    // Simulated amount, just for estimating fees
    // Must be: 0 > amount > max spendable, otherwise the simulation endpoint refuses to cooperate
    amount = spendableBalance > COSMOS_MOCK_FEES ? spendableBalance - COSMOS_MOCK_FEES : 1n;
  }

  const { gasWanted, gasWantedFees } = await getEstimatedFees(
    this.chainId,
    account,
    transaction.data as CompleteTransaction["data"] // safe to cast, amount is always set if useMaxAmount is false
  );

  let fees = gasWantedFees;
  let gas = gasWanted;

  if (transaction.data.useMaxAmount) {
    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER:
      case TransactionMode.DELEGATE:
        amount = spendableBalance > gasWantedFees ? spendableBalance - gasWantedFees : 0n;
        break;

      case TransactionMode.UNDELEGATE:
      case TransactionMode.REDELEGATE:
        amount = spendableBalance;
        break;
    }
  }

  const updatedAccount = resolvePubKey(account, transaction);

  let nonce = account.sequence;

  let params = {
    pubKey: updatedAccount.pubKey,
  };

  return {
    ...transaction,
    data: {
      ...transaction.data,
      nonce,
      params,
      fees,
      gas,
      recipients: [
        {
          ...transaction.data.recipients[0],
          amount: amount as bigint, // safe to cast, amount is always set if useMaxAmount is false
        },
      ],
    },
  };
}

export { completeTransaction };
