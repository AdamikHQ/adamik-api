import { AccountState } from "~/app/model/types_WIP";
import { AptosCoinIdentifier } from "~/app/families/aptos/types";
import { AptosService } from "~/app/families/aptos/service";
import { getAccountCoins, getStakingState } from "~/app/families/aptos/logic";

export async function getAccountState(this: AptosService, address: string): Promise<AccountState> {
  const accountCoins = await getAccountCoins(this.chainId, address);
  const nativeCoin = accountCoins.find((coin) => coin.token.id === AptosCoinIdentifier);

  const staking = await getStakingState(this.chainId, address).catch((e) => {
    console.error(e);
    return undefined;
  });

  const nativeBalance = BigInt(nativeCoin?.amount ?? 0);
  const tokens = accountCoins.filter((tokenAmount) => tokenAmount !== nativeCoin);
  return {
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens,
      staking,
    },
  };
}
