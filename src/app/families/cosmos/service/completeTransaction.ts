import { Transaction } from "~/app/model/types_WIP";
import { getEstimatedFees } from "../logic";
import { fetchBalances } from "../backend/node";
import { CosmosService } from ".";
import { CHAINS } from "~/app/config/chains";
import { CosmosParams } from "../types";

async function completeTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  const chainParams = CHAINS[this.chainId].params as CosmosParams;

  const address = transaction.plain.senders[0];
  const balances = await fetchBalances(this.chainId, address);
  const balance = balances.find((balance) => balance.denom === chainParams?.denom)?.amount;
  if (!balance) {
    throw new Error(`Failed to retrieve balance for ${this.chainId} address ${address}`);
  }

  if (transaction.plain.useMaxAmount) {
    transaction.plain.amount = balance - 2500n; // Simulated amount, just for estimating fees
  }

  const { gasWanted, gasWantedFees } = await getEstimatedFees(this.chainId, transaction.plain);

  if (transaction.plain.useMaxAmount) {
    transaction.plain.amount = balance > gasWantedFees ? balance - gasWantedFees : 0n;
  }

  transaction.plain.fees = gasWantedFees;
  transaction.plain.gas = gasWanted;
}

export { completeTransaction };
