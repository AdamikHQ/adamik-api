import { AccountState, StakingStatus, TokenAmount } from "~/app/model/types_WIP";
import { fetchAccountTokensBalance, fetchNativeBalance } from "../backend/node";
import { fetchStakingPositions } from "../backend/solscan";
import { SolanaService } from "../service";

async function getAccountState(this: SolanaService, accountId: string): Promise<AccountState> {
  const { balance } = await fetchNativeBalance(this.chainId, accountId);
  const nativeBalanceTotal = BigInt(balance);

  let allTokenAmounts: TokenAmount[] = [];
  let nextPaginationToken: string | undefined = undefined;

  do {
    const { tokenAmounts, nextPaginationToken: nextToken } = await fetchAccountTokensBalance(
      this.chainId,
      accountId,
      nextPaginationToken
    );

    allTokenAmounts = [...allTokenAmounts, ...tokenAmounts];
    nextPaginationToken = nextToken ?? undefined;
  } while (nextPaginationToken !== undefined);

  const { stakingPositions, stakingRewards } = await fetchStakingPositions(this.chainId, accountId);

  const { stakeTotal, stakeLocked, stakeUnlocking, stakeUnlocked } = stakingPositions.reduce(
    (acc, stakeAccount) => {
      if (stakeAccount.status === StakingStatus.LOCKED) {
        acc.stakeLocked += stakeAccount.amount;
      }
      if (stakeAccount.status === StakingStatus.UNLOCKING) {
        acc.stakeUnlocking += stakeAccount.amount;
      }
      if (stakeAccount.status === StakingStatus.UNLOCKED) {
        acc.stakeUnlocked += stakeAccount.amount;
      }
      acc.stakeTotal += stakeAccount.amount;
      return acc;
    },
    { stakeTotal: 0n, stakeLocked: 0n, stakeUnlocking: 0n, stakeUnlocked: 0n }
  );

  return {
    balances: {
      native: {
        available: nativeBalanceTotal,
        total: nativeBalanceTotal,
      },
      tokens: allTokenAmounts,
      staking: {
        total: BigInt(stakeTotal),
        locked: BigInt(stakeLocked),
        unlocking: BigInt(stakeUnlocking),
        unlocked: BigInt(stakeUnlocked),
        positions: stakingPositions,
        rewards: {
          native: stakingRewards,
          tokens: [],
        },
      },
    },
  };
}

export { getAccountState };
