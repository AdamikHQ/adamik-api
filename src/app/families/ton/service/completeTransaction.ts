import { stringToHex } from "viem";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { getSeqno } from "../backend/tonapi";
import { computeFees, computeMaxSpendable } from "../logic";

async function completeTransaction(_: { transaction: Transaction; status: Status }): Promise<void> {
  const { transaction, status } = _;

  const timeout = Math.floor(Date.now() / 1e3) + 60 * 10; // 10 minutes timestamps
  transaction.data.params = stringToHex(JSON.stringify({ timeout }));

  const maxSpendable = await computeMaxSpendable(transaction.data);

  // NOTE: In case of token transfer, jetton master wallet is not a wallet contract but a jetton contract and can't get a seqno
  if (transaction.data.mode === TransactionMode.TRANSFER) {
    const seqNo = await getSeqno(transaction.data.senderAddress);

    if (seqNo === null) {
      transaction.data.nonce = 0n;
    } else {
      transaction.data.nonce = seqNo;
    }
  }

  if (transaction.data.useMaxAmount) {
    transaction.data.amount = maxSpendable;
  }

  transaction.data.fees = await computeFees(transaction.data, timeout);

  if (transaction.data.useMaxAmount) {
    transaction.data.amount = maxSpendable - transaction.data.fees;
  }
}

export { completeTransaction };
