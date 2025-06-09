import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { fetchAccountHistory } from "../backend/helius";
import { SolanaService } from "../service";

async function getAccountHistory(
  this: SolanaService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  const { transactions, nextPage } = await fetchAccountHistory(this.chainId, accountId, paginationToken);

  return {
    transactions,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountHistory };
