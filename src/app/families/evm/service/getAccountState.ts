import { AccountState, StakingPosition, TokenAmount } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";
import { fetchStakingPositions } from "../backend/stakewise";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountState(this: EvmService, accountId: EvmAddress): Promise<AccountState> {
  const result: AccountState = {
    balances: {
      native: {
        available: 0n,
        total: 0n,
      },
    },
  };

  // Native
  const nativeBalance = await fetchBalance(this.chainId, accountId);
  result.balances.native = {
    available: nativeBalance,
    total: nativeBalance,
  };

  // Tokens
  try {
    const indexer = this.getIndexer();
    result.balances.tokens = await indexer.fetchAllERC20TokenAmounts(this.chainId, accountId);
  } catch (error: any) {
    console.warn(`Error while fetching token balances for chain ${this.chainId}:`, JSON.stringify(error));
  }

  // Staking
  try {
    const stakingPositions = await fetchStakingPositions(this.chainId, accountId);
    result.balances.staking = {
      positions: stakingPositions,
      total: stakingPositions.reduce((acc, position) => acc + position.amount, 0n),
      locked: stakingPositions.reduce((acc, position) => acc + position.amount, 0n),
      // TODO Fetch unlocked position + rewards
      unlocking: 0n,
      unlocked: 0n,
    };
  } catch (error: any) {
    console.warn(`Error while fetching staking balances for chain ${this.chainId}:`, JSON.stringify(error));
  }

  return {
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
}

export { getAccountState };
