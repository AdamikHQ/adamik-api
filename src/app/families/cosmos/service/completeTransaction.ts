import { PlainTransaction } from "~/app/model/types_WIP";
import { getEstimatedFees } from "../logic";
import { fetchBalance } from "../backend/node";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

async function completeTransaction(transaction: PlainTransaction): Promise<PlainTransaction> {
  const balance = await fetchBalance(transaction.senders[0]);
  const { gasWanted, gasWantedFees } = await getEstimatedFees({
    ...transaction,
    amount: transaction.useMaxAmount ? balance - 2500n : transaction.amount, // FIXME Magic number !
  });

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
