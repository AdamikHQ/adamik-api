import { PlainTransaction, Transaction, TransactionStatus } from "~/app/model/types_WIP";
import { getEstimatedFees } from "../logic";
import { fetchBalance } from "../backend/node";
import { CosmosService } from ".";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

async function completeTransaction(this: CosmosService, transaction: PlainTransaction): Promise<Transaction> {
  // Completion
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

  // Validation
  const status = await validateTransaction(transaction);

  return {
    plain: {
      ...transaction,
      fees: gasWantedFees,
      gas: gasWanted,
      amount,
    },
    status,
  };
}

async function validateTransaction(transaction: PlainTransaction): Promise<TransactionStatus> {
  const status: TransactionStatus = { errors: [], warnings: [] };

  // TODO

  // NOTE amount can't be 0 on cosmos chains?...

  return status;
}

export { completeTransaction };
