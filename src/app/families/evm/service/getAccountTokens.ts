import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountTokens(
  this: EvmService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const indexer = this.getIndexer();
  const { tokens, nextPage } = await indexer.fetchERC20TokenAmounts(
    this.chainId,
    accountId as EvmAddress,
    paginationToken
  );

  return {
    tokens,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
