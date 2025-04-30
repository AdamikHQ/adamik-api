import { AccountHistory, FinalizedTransaction, Paginated, TransactionMode } from "~/app/model/types_WIP";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountHistory(
  this: EvmService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  const indexer = this.getIndexer();

  const { evmTransactions, nextPage } = await indexer.fetchAccountTransactions(
    this.chainId,
    accountId as EvmAddress,
    paginationToken
  );

  // Fix for consistent mode values between getTransaction and getAccountHistory endpoints
  const fixedTransactions = evmTransactions.map((transaction) => {
    // Check if this is a self-transfer (same sender and recipient address)
    if (
      transaction.parsed &&
      transaction.parsed.mode === "unknown" &&
      transaction.parsed.senders &&
      transaction.parsed.recipients &&
      transaction.parsed.senders.length > 0 &&
      transaction.parsed.recipients.length > 0 &&
      transaction.parsed.senders[0].address === transaction.parsed.recipients[0].address
    ) {
      // Clone the transaction to avoid mutating the original object
      const fixedTransaction: FinalizedTransaction = {
        ...transaction,
        parsed: {
          ...transaction.parsed,
          mode: TransactionMode.TRANSFER,
        },
      };

      return fixedTransaction;
    }

    return transaction;
  });

  return {
    transactions: fixedTransactions,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountHistory };
