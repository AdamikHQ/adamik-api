import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { AptosService } from "~/app/families/aptos/service";
import { getAccountCoins } from "~/app/families/aptos/logic";

export async function getAccountTokens(
  this: AptosService,
  address: string
): Promise<Paginated<AccountTokens>> {
  const tokens = await getAccountCoins(this.chainId, address);

  return {
    tokens,
    pagination: {
      nextPage: null,
    },
  };
}
