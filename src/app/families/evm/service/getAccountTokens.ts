import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { fetchERC20TokenAmounts as alchemyFetch } from "../backend/alchemy";
import { fetchERC20TokenAmounts as moralisFetch } from "../backend/moralis";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountTokens(
  this: EvmService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const { tokens, nextPage } = await alchemyFetch(this.chainId, accountId as EvmAddress, paginationToken);

  return {
    tokens,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
