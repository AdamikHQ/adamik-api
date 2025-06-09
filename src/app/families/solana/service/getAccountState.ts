import { AccountState, StakingStatus, TokenAmount } from "~/app/model/types_WIP";
import { fetchAccountTokensBalance, fetchNativeBalance, fetchStakePositions } from "../backend/node";
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

  const { stakePositions, rewardsPositions } = await fetchStakePositions(this.chainId, accountId);

  const { stakeTotal, stakeLocked, stakeUnlocking, stakeUnlocked } = stakePositions.reduce(
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
        positions: stakePositions,
        rewards: {
          native: rewardsPositions,
          tokens: [],
        },
      },
    },
  };
}

export { getAccountState };
