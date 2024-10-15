import {
  AccountHistory,
  AccountHistoryPagination,
  ApiRequestFilters,
  FinalizedTransaction,
} from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { fetchAccountTransactions, mintscanToAdamikTransaction } from "../backend/mintscan";

async function getAccountHistory(
  this: CosmosService,
  accountId: string,
  pagination: AccountHistoryPagination,
  filters: ApiRequestFilters
): Promise<AccountHistory> {
  const transactions: FinalizedTransaction[] = [];

  // TODO Apply filters

  const cosmosTransactions = await fetchAccountTransactions(this.chainId, accountId, pagination);

  for (const cosmosTransaction of cosmosTransactions) {
    const parsedTransaction = mintscanToAdamikTransaction(this.chainId, cosmosTransaction);

    parsedTransaction &&
      transactions.push({
        parsed: parsedTransaction,
      });
  }

  return {
    chainId: this.chainId,
    accountId,
    transactions,
  };
}

export { getAccountHistory };
