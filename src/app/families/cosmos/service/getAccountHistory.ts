import { AccountHistory, AccountHistoryPagination, FinalizedTransaction } from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { fetchAccountTransactions, mintscanToAdamikTransaction } from "../backend/mintscan";

async function getAccountHistory(
  this: CosmosService,
  accountId: string,
  pagination: AccountHistoryPagination
): Promise<AccountHistory> {
  const transactions: FinalizedTransaction[] = [];

  const cosmosTransactions = await fetchAccountTransactions(this.chainId, accountId, pagination);

  for (const cosmosTransaction of cosmosTransactions) {
    const parsedTransaction = mintscanToAdamikTransaction(this.chainId, cosmosTransaction);

    transactions.push({
      parsed: parsedTransaction,
      raw: cosmosTransaction,
    });
  }

  return {
    chainId: this.chainId,
    accountId,
    transactions,
  };
}

export { getAccountHistory };
