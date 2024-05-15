import { PlainTransaction } from "~/app/model/types_WIP";
import { getEstimatedFees } from "../logic";
import { fetchBalance } from "../backend/node";
import { CosmosService } from ".";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

async function completeTransaction(
  this: CosmosService,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  const balance = await fetchBalance(this.chainId, transaction.senders[0]);
  const transactionToEstimate = {
    ...transaction,
    amount: transaction.useMaxAmount ? balance - 2500n : transaction.amount, // FIXME Magic number !
  };
  const { gasWanted, gasWantedFees } = await getEstimatedFees(this.chainId, transactionToEstimate);

  const amount = transaction.useMaxAmount
    ? balance > gasWantedFees
      ? balance - gasWantedFees
      : 0n
    : transaction.amount;

  return {
    ...transaction,
    fees: gasWantedFees,
    gas: gasWanted,
    amount,
  };
}

export { completeTransaction };
