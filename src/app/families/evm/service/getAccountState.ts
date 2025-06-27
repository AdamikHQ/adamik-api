import { AccountState, StakingPosition, TokenAmount } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";
import { fetchStakePosition } from "../backend/stakewise";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountState(this: EvmService, accountId: EvmAddress): Promise<AccountState> {
  // Native
  const nativeBalance = await fetchBalance(this.chainId, accountId);
  const result = {
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens: [] as TokenAmount[],
      staking: {
        total: 0n,
        locked: 0n,
        unlocking: 0n,
        unlocked: 0n,
        positions: [] as StakingPosition[],
      },
    },
  };
  try {
    const indexer = this.getIndexer();
    result.balances.tokens = await indexer.fetchAllERC20TokenAmounts(this.chainId, accountId);
  } catch {}
  try {
    const stakePositions = await fetchStakePosition(this.chainId, accountId);
    result.balances.staking.positions = stakePositions;
    result.balances.staking.total = stakePositions.reduce((acc, position) => acc + position.amount, 0n);
    result.balances.staking.locked = stakePositions.reduce((acc, position) => acc + position.amount, 0n);
    // NOTE: Need to fetch unlocked position + rewards
  } catch (e) {
    console.warn("Error fetching stake positions", e);
  }
  return result;
}

export { getAccountState };
