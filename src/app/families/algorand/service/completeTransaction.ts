import { ChainId, PlainTransaction } from "~/app/model/types_WIP";
import { estimateMaxSpendable, getEstimatedFees } from "~/app/families/algorand/logic";

async function completeTransaction(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
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
