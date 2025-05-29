import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { fetchTokenBalances } from "../backend/indexer";
import { mapTokenBalancesToTokenAmounts } from "../logic";
import { StarknetService } from "../service";

async function getAccountTokens(
  this: StarknetService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const { balances, nextPage } = await fetchTokenBalances(this.chainId, accountId, paginationToken);

  return {
    tokens: await mapTokenBalancesToTokenAmounts(this.chainId, balances),
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
