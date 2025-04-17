import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { fetchAccountCoins, populateCoinData } from "~/app/families/aptos/backend/node";
import { AptosService } from "~/app/families/aptos/service";

export async function getAccountTokens(
  this: AptosService,
  address: string
): Promise<Paginated<AccountTokens>> {
  const accountCoins = await fetchAccountCoins(this.chainId, address);
  const tokenAmounts = accountCoins
    .map((coin) => {
      const coinId = coin.type.match(/^0x1::coin::CoinStore<(.+)>$/);
      if (!coinId) return null;
      const id = coinId[1];
      return {
        id,
        amount: BigInt(coin.data.coin.value),
      };
    })
    .filter(Boolean);
  const tokens = await populateCoinData(this.chainId, tokenAmounts as { id: string; amount: bigint }[]);

  return {
    tokens,
    pagination: {
      nextPage: null,
    },
  };
}
