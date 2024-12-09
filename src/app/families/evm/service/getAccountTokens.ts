import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { fetchERC20TokenAmounts } from "../backend/moralis";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountTokens(
  this: EvmService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const { tokens, nextPage } = await fetchERC20TokenAmounts(
    this.chainId,
    accountId as EvmAddress,
    paginationToken
  );

  return {
    chainId: this.chainId,
    accountId,
    tokens,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
