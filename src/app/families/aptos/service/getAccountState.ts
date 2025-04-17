import { AccountState } from "~/app/model/types_WIP";
import { fetchAccountCoins, populateCoinData } from "~/app/families/aptos/backend/node";
import { AptosCoinIdentifier } from "~/app/families/aptos/types";
import { AptosService } from "~/app/families/aptos/service";

export async function getAccountState(this: AptosService, address: string): Promise<AccountState> {
  const accountCoins = await fetchAccountCoins(this.chainId, address);
  const native = accountCoins.find((coin) => coin.type === AptosCoinIdentifier);

  const nativeBalance = BigInt(native?.data.coin.value ?? 0);
  const tokenAmounts = accountCoins
    .filter((coin) => coin.type !== AptosCoinIdentifier)
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
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens,
    },
  };
}
