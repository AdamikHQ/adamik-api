import { stringToHex } from "viem";
import { Status, Transaction } from "~/app/model/types_WIP";
import { getSeqno } from "../backend/tonapi";
import { computeFees, computeMaxSpendable } from "../logic";

async function completeTransaction(_: { transaction: Transaction; status: Status }): Promise<void> {
  const { transaction, status } = _;

  const timeout = Math.floor(Date.now() / 1e3) + 60 * 10; // 10 minutes timestamps
  transaction.data.params = stringToHex(JSON.stringify({ timeout }));

  const maxSpendable = await computeMaxSpendable(transaction.data);

  const seqNo = await getSeqno(transaction.data.senderAddress);
  if (seqNo) {
    transaction.data.nonce = seqNo;
  }

  transaction.data.fees = await computeFees(transaction.data, timeout);

  if (transaction.data.useMaxAmount) {
    const amount = maxSpendable - transaction.data.fees;

    transaction.data.amount = amount && amount >= 0n ? amount : 0n;
  }
}

export { completeTransaction };
