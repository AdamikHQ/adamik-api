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
  const functionNames = ["Alchemy", "Moralis"];
  const functions = [alchemyFetch, moralisFetch];
  const index = Math.floor(Math.random() * 2);
  console.log(`Fetching with ${functionNames[index]}`);
  const start = Date.now();
  const { tokens, nextPage } = await functions[index](this.chainId, accountId as EvmAddress, paginationToken);
  console.log(`Done in ${Date.now() - start}ms`);

  return {
    tokens,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
