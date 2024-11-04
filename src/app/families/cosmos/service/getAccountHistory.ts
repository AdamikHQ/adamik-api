import { AccountHistory, FinalizedTransaction, Paginated } from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { fetchAccountTransactions, mintscanToAdamikTransaction } from "../backend/mintscan";

async function getAccountHistory(
  this: CosmosService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  const transactions: FinalizedTransaction[] = [];

  const { cosmosTransactions, nextPage } = await fetchAccountTransactions(
    this.chainId,
    accountId,
    paginationToken
  );

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
    nextPage,
  };
}

export { getAccountHistory };
