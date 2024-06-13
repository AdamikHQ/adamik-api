import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { computeMaxSpendable, computeFees } from "../logic";

async function completeTransaction(transaction: Transaction): Promise<void> {
  const maxSpendable = await computeMaxSpendable(transaction.plain);

  transaction.plain.fees = await computeFees(transaction.plain);

  if (transaction.plain.useMaxAmount) {
    const amount =
      transaction.plain.mode === TransactionMode.TRANSFER_TOKEN
        ? // For a token transaction, the max spent amount is just the token balance, because fees are deducted from the native balance
          maxSpendable.token
        : // For a native transaction, the max spent amount is the native amount minus the fees, because both tap in the same native balance
          maxSpendable.native - transaction.plain.fees;

    transaction.plain.amount = amount && amount >= 0n ? amount : 0n;
  }
}

export { completeTransaction };
