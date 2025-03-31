import { AccountHistory, FinalizedTransaction, Paginated, TransactionState } from "~/app/model/types_WIP";
import { getAccountTransactions } from "~/app/families/aptos/backend/node";

export async function getAccountHistory(address: string): Promise<Paginated<AccountHistory>> {
  const transactions = await getAccountTransactions(address);

  return {
    transactions: transactions.map((tx) => {
      const adamikTransaction: FinalizedTransaction = {
        parsed: {
          id: tx.hash,
          mode: "unknown",
          state: TransactionState.UNKNOWN,
          fees: {
            amount: 0n,
          },
          senders: [],
          recipients: [],
        },
        raw: tx,
      };
      // All transactions from indexer are confirmed
      adamikTransaction.parsed!.state = TransactionState.CONFIRMED;
      adamikTransaction.parsed!.senders!.push({
        address: tx.sender,
        amount: 0n,
      });
      return adamikTransaction;
    }),
    pagination: {
      nextPage: null,
    },
  };
}
