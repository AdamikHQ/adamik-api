import { Transaction } from "~/app/model/types_WIP";
import { getSeqno } from "../backend/explorer";
import { computeFees, computeMaxSpendable } from "../logic";

async function completeTransaction(transaction: Transaction): Promise<void> {
  const maxSpendable = await computeMaxSpendable(transaction.data);

  transaction.data.nonce = await getSeqno(transaction.data.sender);

  transaction.data.fees = await computeFees(transaction.data);

  if (transaction.data.useMaxAmount) {
    const amount = maxSpendable - transaction.data.fees;

    transaction.data.amount = amount && amount >= 0n ? amount : 0n;
  }
}

export { completeTransaction };
