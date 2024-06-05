import { PlainTransaction, TransactionMode } from "~/app/model/types_WIP";
import { computeMaxSpendable, computeFees } from "~/app/families/algorand/logic";
import { AlgorandService } from ".";

async function completeTransaction(
  this: AlgorandService,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  const fees = await computeFees(transaction);

  const amount = await (async () => {
    if (transaction.useMaxAmount) {
      const maxSpendable = await computeMaxSpendable(transaction);
      const amount = transaction.mode === TransactionMode.TRANSFER_TOKEN ? maxSpendable : maxSpendable - fees;
      return amount >= 0n ? amount : 0n;
    } else {
      return transaction.amount;
    }
  })();

  return { ...transaction, amount, fees };
}

export { completeTransaction };
