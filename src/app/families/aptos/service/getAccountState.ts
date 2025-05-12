import { AccountState, StakingPosition, StakingStatus } from "~/app/model/types_WIP";
import { fetchAccountCoins, populateCoinData } from "~/app/families/aptos/backend/node";
import { AptosCoinIdentifier } from "~/app/families/aptos/types";
import { AptosService } from "~/app/families/aptos/service";
import { getStakingPositions } from "~/app/families/aptos/logic";

export async function getAccountState(this: AptosService, address: string): Promise<AccountState> {
  const accountCoins = await fetchAccountCoins(this.chainId, address);
  const native = accountCoins.find((coin) => coin.type === AptosCoinIdentifier);

  const stakingPositions = await getStakingPositions(this.chainId, address).catch(() => []);

  const staking: AccountState["balances"]["staking"] = {
    total: 0n,
    locked: 0n,
    unlocking: 0n,
    unlocked: 0n,
    positions: [] as StakingPosition[],
    rewards: {
      native: [],
      tokens: [],
    },
  };
  for (const position of stakingPositions) {
    staking.total += BigInt(position.status.reduce((a, c) => a + c));
    staking.locked += BigInt(position.status[0]);
    staking.unlocking += BigInt(position.status[2]);
    staking.unlocked += BigInt(position.status[1]);
    if (position.status[0] > 0) {
      staking.positions.push({
        validatorAddresses: [position.delegationPool],
        amount: BigInt(position.status[0]),
        status: StakingStatus.LOCKED,
      });
    }
    if (position.status[1] > 0) {
      staking.positions.push({
        validatorAddresses: [position.delegationPool],
        amount: BigInt(position.status[1]),
        status: StakingStatus.UNLOCKED,
      });
    }
    if (position.status[2] > 0) {
      staking.positions.push({
        validatorAddresses: [position.delegationPool],
        amount: BigInt(position.status[2]),
        status: StakingStatus.UNLOCKING,
      });
    }
  }

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
      staking,
    },
  };
}
