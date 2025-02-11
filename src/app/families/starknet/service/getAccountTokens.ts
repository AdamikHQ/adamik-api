import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { fetchTokenBalances } from "../backend/indexer";
import { tokenBalanceToAccountToken } from "../logic";
import { StarknetService } from "../service";

async function getAccountTokens(
  this: StarknetService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const { balances, nextPage } = await fetchTokenBalances(accountId, paginationToken);

  return {
    tokens: await tokenBalanceToAccountToken(balances),
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
