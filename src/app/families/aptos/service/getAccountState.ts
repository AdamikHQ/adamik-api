import { AccountState, StakingPosition, StakingStatus } from "~/app/model/types_WIP";
import { populateCoinData } from "~/app/families/aptos/backend/node";
import { AptosCoinIdentifier } from "~/app/families/aptos/types";
import { AptosService } from "~/app/families/aptos/service";
import { getStakingPositions } from "~/app/families/aptos/logic";
import { fetchAccountCoins } from "~/app/families/aptos/backend/indexer";

export async function getAccountState(this: AptosService, address: string): Promise<AccountState> {
  const accountCoins = await fetchAccountCoins(this.chainId, address);
  const native = accountCoins.find((coin) => coin.asset_type === AptosCoinIdentifier);

  const positions = await getStakingPositions(this.chainId, address).catch((e) => {
    console.error(e);
    return [] as StakingPosition[];
  });

  const staking: AccountState["balances"]["staking"] = {
    total: 0n,
    locked: 0n,
    unlocking: 0n,
    unlocked: 0n,
    positions,
    rewards: {
      native: [],
      tokens: [],
    },
  };
  for (const position of positions) {
    staking.total += position.amount;
    if (position.status === StakingStatus.LOCKED) {
      staking.locked += position.amount;
    }
    if (position.status === StakingStatus.UNLOCKING) {
      staking.unlocking += position.amount;
    }
    if (position.status === StakingStatus.UNLOCKED) {
      staking.unlocked += position.amount;
    }
  }

  const nativeBalance = BigInt(native?.amount ?? 0);
  const tokenAmounts = accountCoins
    .filter((coin) => coin.asset_type !== AptosCoinIdentifier)
    .map((coin) => {
      const coinId = coin.asset_type.match(/^0x1::coin::CoinStore<(.+)>$/);
      if (!coinId) return null;
      const id = coinId[1];
      return {
        id,
        amount: BigInt(coin.amount),
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
      staking,
    },
  };
}
