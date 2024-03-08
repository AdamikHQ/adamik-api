import { ChainId, PlainTransaction } from "~/app/model/types_WIP";
import { getEstimatedFees } from "../logic";
import { fetchBalance } from "../backend/node";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

async function completeTransaction(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  const balance = await fetchBalance(chainId, transaction.senders[0]);
  const transactionToEstimate = {
    ...transaction,
    amount: transaction.useMaxAmount ? balance - 2500n : transaction.amount, // FIXME Magic number !
  };
  const { gasWanted, gasWantedFees } = await getEstimatedFees(chainId, transactionToEstimate);

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
