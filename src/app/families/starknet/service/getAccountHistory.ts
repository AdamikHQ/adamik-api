import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { fetchTransactionHistory } from "../backend/indexer";
import { StarknetService } from "../service";

async function getAccountHistory(
  this: StarknetService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  const { transactions, nextPage } = await fetchTransactionHistory(accountId, paginationToken);

  return {
    transactions,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountHistory };
