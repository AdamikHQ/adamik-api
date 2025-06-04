import { PublicKey, StakeProgram } from "@solana/web3.js";
import { AccountState, StakingStatus, TokenAmount } from "~/app/model/types_WIP";
import { fetchAccount, fetchAccountTokensBalance, fetchStakePositions } from "../backend/node";
import { SolanaService } from "../service";

async function getAccountState(this: SolanaService, accountId: string): Promise<AccountState> {
  const { balance } = await fetchAccount(accountId);
  const nativeBalanceTotal = BigInt(balance);

  let allTokenAmounts: TokenAmount[] = [];
  let nextPaginationToken: string | undefined = undefined;

  do {
    const { tokenAmounts, nextPaginationToken: nextToken } = await fetchAccountTokensBalance(
      accountId,
      nextPaginationToken
    );

    allTokenAmounts = [...allTokenAmounts, ...tokenAmounts];
    nextPaginationToken = nextToken ?? undefined;
  } while (nextPaginationToken !== undefined);

  const stakeAccounts = await fetchStakePositions(StakeProgram.programId, new PublicKey(accountId));

  const stakeTotal = stakeAccounts.reduce((acc, stakeAccount) => acc + stakeAccount.amount, 0n);
  const stakeLocked = stakeAccounts.reduce((acc, stakeAccount) => {
    if (stakeAccount.status === StakingStatus.LOCKED) {
      return acc + stakeAccount.amount;
    }
    return acc;
  }, 0n);
  const stakeUnlocking = stakeAccounts.reduce((acc, stakeAccount) => {
    if (stakeAccount.status === StakingStatus.UNLOCKING) {
      return acc + stakeAccount.amount;
    }
    return acc;
  }, 0n);

  const stakeUnlocked = stakeAccounts.reduce((acc, stakeAccount) => {
    if (stakeAccount.status === StakingStatus.UNLOCKED) {
      return acc + stakeAccount.amount;
    }
    return acc;
  }, 0n);

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
        positions: stakeAccounts,
        rewards: {
          native: [],
          tokens: [],
        },
      },
    },
  };
}

export { getAccountState };
