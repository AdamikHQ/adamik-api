import { Transaction } from "~/app/model/types_WIP";
import { getEstimatedFees } from "../logic";
import { fetchBalance } from "../backend/node";
import { CosmosService } from ".";

async function completeTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  const balance = await fetchBalance(this.chainId, transaction.plain.senders[0]);

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
