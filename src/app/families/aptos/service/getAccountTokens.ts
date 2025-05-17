import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { populateCoinData } from "~/app/families/aptos/backend/node";
import { AptosService } from "~/app/families/aptos/service";
import { fetchAccountCoins } from "~/app/families/aptos/backend/indexer";

export async function getAccountTokens(
  this: AptosService,
  address: string
): Promise<Paginated<AccountTokens>> {
  const accountCoins = await fetchAccountCoins(this.chainId, address);
  const tokenAmounts = accountCoins.map((coin) => {
    return {
      id: coin.asset_type,
      amount: BigInt(coin.amount),
    };
  });
  const tokens = await populateCoinData(this.chainId, tokenAmounts as { id: string; amount: bigint }[]);

  return {
    tokens,
    pagination: {
      nextPage: null,
    },
  };
}
