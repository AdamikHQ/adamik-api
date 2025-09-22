import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { getSeqno } from "../backend/tonapi";
import { computeEstimatedFees, computeMaxSpendable } from "../logic";
import { TonTransactionParams } from "../types";

async function completeTransaction(_: { transaction: Transaction; status: Status }): Promise<void> {
  const { transaction, status } = _;

  const timeout = Math.floor(Date.now() / 1e3) + 60 * 10; // 10 minutes timestamps
  transaction.data.params = { timeout } as TonTransactionParams;

  const maxSpendable = await computeMaxSpendable(transaction.data);

  // NOTE: In case of token transfer, jetton master wallet is not a wallet contract but a jetton contract and can't get a seqno
  if (transaction.data.mode === TransactionMode.TRANSFER) {
    const seqNo = await getSeqno(transaction.data.senderAddress);

    transaction.data.nonce = seqNo ?? 0n;
  }

  if (transaction.data.useMaxAmount) {
    transaction.data.amount = maxSpendable;
  }

  transaction.data.fees = await computeEstimatedFees(transaction.data, timeout);

  if (transaction.data.useMaxAmount) {
    transaction.data.amount = maxSpendable - transaction.data.fees;
  }
}

export { completeTransaction };
