import { PlainTransaction } from "~/app/model/types_WIP";
import { estimateMaxSpendable, getEstimatedFees } from "~/app/chains/algorand/logic";

async function completeTransaction(transaction: PlainTransaction): Promise<PlainTransaction> {
  const fees = await getEstimatedFees(transaction);

  const amount = await (async () => {
    if (transaction.useMaxAmount) {
      const maxSpendable = await estimateMaxSpendable(transaction);
      const amount = maxSpendable - fees;
      return amount >= 0n ? amount : 0n;
    } else {
      return transaction.amount;
    }
  })();

  return { ...transaction, amount, fees };
}

export { completeTransaction };
