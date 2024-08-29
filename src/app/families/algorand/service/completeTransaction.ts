import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { computeFees, computeMaxSpendable } from "../logic";

async function completeTransaction(transaction: Transaction): Promise<void> {
  const maxSpendable = await computeMaxSpendable(transaction.data);

  transaction.data.fees = await computeFees(transaction.data);

  if (transaction.data.useMaxAmount) {
    const amount =
      transaction.data.mode === TransactionMode.TRANSFER_TOKEN
        ? // For a token transaction, the max spent amount is just the token balance, because fees are deducted from the native balance
          maxSpendable.token
        : // For a native transaction, the max spent amount is the native amount minus the fees, because both tap in the same native balance
          maxSpendable.native - transaction.data.fees;

    transaction.data.amount = amount && amount >= 0n ? amount : 0n;
  }
}

export { completeTransaction };
