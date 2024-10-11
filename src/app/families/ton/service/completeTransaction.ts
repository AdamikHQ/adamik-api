import { Status, Transaction } from "~/app/model/types_WIP";
import { getSeqno } from "../backend/explorer";
import { computeFees, computeMaxSpendable } from "../logic";

async function completeTransaction(_: { transaction: Transaction; status: Status }): Promise<void> {
  const { transaction, status } = _;

  const maxSpendable = await computeMaxSpendable(transaction.data);

  const seqNo = await getSeqno(transaction.data.sender);
  transaction.data.nonce = seqNo || undefined;

  transaction.data.fees = await computeFees(transaction.data);

  if (transaction.data.useMaxAmount) {
    const amount = maxSpendable - transaction.data.fees;

    transaction.data.amount = amount && amount >= 0n ? amount : 0n;
  }
}

export { completeTransaction };
