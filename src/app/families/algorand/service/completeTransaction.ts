import { CompleteTransaction, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { computeMaxSpendable, computeFees } from "../logic";

async function completeTransaction(transaction: Transaction): Promise<CompleteTransaction> {
  const maxSpendable = await computeMaxSpendable(transaction.data);

  let calculatedAmount = transaction.data.recipients[0].amount;
  if (transaction.data.useMaxAmount) {
    const amount =
      transaction.data.mode === TransactionMode.TRANSFER_TOKEN
        ? // For a token transaction, the max spent amount is just the token balance, because fees are deducted from the native balance
          maxSpendable.token
        : // For a native transaction, the max spent amount is the native amount minus the fees, because both tap in the same native balance
          maxSpendable.native - transaction.data.fees;

    calculatedAmount = amount && amount >= 0n ? amount : 0n;
  }
  const completeTransaction: CompleteTransaction = {
    ...transaction,
    data: {
      ...transaction.data,
      recipients: [
        {
          ...transaction.data.recipients[0],
          amount: calculatedAmount as bigint, // safe to cast, amount is never undefined when useMaxAmount is false
        },
      ],
    },
  };
  completeTransaction.data.fees = await computeFees(completeTransaction.data);
  return completeTransaction;
}

export { completeTransaction };
