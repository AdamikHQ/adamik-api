import { PlainTransaction } from "~/app/model/types_WIP";
import {
  estimateMaxSpendable,
  getEstimatedFees,
} from "~/app/chains/algorand/logic";

async function completeTransaction(
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  const fees = await getEstimatedFees(transaction);

  const amount = transaction.useMaxAmount
    ? (await estimateMaxSpendable(transaction)) - fees
    : transaction.amount;

  return { ...transaction, amount, fees };
}

export { completeTransaction };
