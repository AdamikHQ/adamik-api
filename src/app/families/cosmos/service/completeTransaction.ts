import { Transaction } from "~/app/model/types_WIP";
import { getEstimatedFees, resolvePubKey } from "../logic";
import { fetchAccount, fetchBalances } from "../backend/node";
import { CosmosService } from ".";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams } from "../types";

async function completeTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;

  const senderAddress = transaction.plain.senders[0];
  const account = await fetchAccount(this.chainId, senderAddress);
  const balances = await fetchBalances(this.chainId, senderAddress);
  const balance = balances.find((balance) => balance.denom === chainParams?.denom);
  if (!balance) {
    throw new Error(`Failed to retrieve balance for ${this.chainId} address ${senderAddress}`);
  }

  const balanceAmount = BigInt(balance.amount);

  if (transaction.plain.useMaxAmount) {
    transaction.plain.amount = balanceAmount - 2500n; // Simulated amount, just for estimating fees
  }

  const { gasWanted, gasWantedFees } = await getEstimatedFees(this.chainId, account, transaction.plain);

  transaction.plain.fees = gasWantedFees;
  transaction.plain.gas = gasWanted;

  if (transaction.plain.useMaxAmount) {
    transaction.plain.amount = balanceAmount > gasWantedFees ? balanceAmount - gasWantedFees : 0n;
  }

  const updatedAccount = resolvePubKey(account, transaction);

  transaction.plain.nonce = account.sequence;

  transaction.plain.params = {
    pubKey: updatedAccount.pubKey,
  };
}

export { completeTransaction };
