import { AccountState, StakingPosition, StakingStatus } from "~/app/model/types_WIP";
import { fetchBalance } from "../backend/node";
import { fetchStakingData } from "../backend/stakewise";
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
  if (this.chain.supportedFeatures.read.account.balances.tokens) {
    try {
      const indexer = this.getIndexer();
      result.balances.tokens = await indexer.fetchAllERC20TokenAmounts(this.chainId, accountId);
    } catch (error: any) {
      console.warn(`Error while fetching token balances for chain ${this.chainId}:`, JSON.stringify(error));
    }
  }

  // Staking
  if (this.chain.supportedFeatures.read.account.balances.staking) {
    try {
      const stakingData = await fetchStakingData(this.chainId, accountId);

      const stakingPositions: StakingPosition[] = [];

      stakingData.forEach((allocator) => {
        // Compute remaining locked amount after subtracting all exit requests (unlocking amounts)
        const totalAmount = BigInt(allocator.assets);
        const unlockingAmount = allocator.exitRequests.reduce(
          (sum, exitRequest) => sum + BigInt(exitRequest.totalAssets),
          0n
        );
        const lockedAmount = totalAmount - unlockingAmount;

        // Create locked position if balance is positive
        if (lockedAmount > 0n) {
          stakingPositions.push({
            stakeId: allocator.id,
            validatorAddresses: [allocator.vault.id],
            amount: lockedAmount,
            status: StakingStatus.LOCKED,
          });
        }

        // Create unlocking & unlocked positions from exit requests
        allocator.exitRequests
          // FIXME It seems that even after a withdraw, funds are not available just yet?...
          // So for a while, amounts that have just been withdrawn are not part of the account state??
          // Could be solved with a WITHDRAWN status, but just filtering these amounts for now
          .filter((exitRequest) => !exitRequest.isClaimed)
          .forEach((exitRequest) => {
            const unlockingPosition: StakingPosition = {
              stakeId: exitRequest.id,
              validatorAddresses: [allocator.vault.id],
              amount: BigInt(exitRequest.totalAssets),
              status: exitRequest.isClaimable ? StakingStatus.UNLOCKED : StakingStatus.UNLOCKING,
            };

            if (exitRequest.withdrawalTimestamp) {
              unlockingPosition.completionDate = Number(exitRequest.withdrawalTimestamp) * 1000;
            }

            stakingPositions.push(unlockingPosition);
          });
      });

      result.balances.staking = {
        positions: stakingPositions,
        total: stakingPositions.reduce((acc, position) => acc + position.amount, 0n),
        locked: stakingPositions
          .filter((position) => position.status === StakingStatus.LOCKED)
          .reduce((acc, position) => acc + position.amount, 0n),
        unlocking: stakingPositions
          .filter((position) => position.status === StakingStatus.UNLOCKING)
          .reduce((acc, position) => acc + position.amount, 0n),
        unlocked: stakingPositions
          .filter((position) => position.status === StakingStatus.UNLOCKED)
          .reduce((acc, position) => acc + position.amount, 0n),
      };
    } catch (error: any) {
      console.warn(`Error while fetching staking balances for chain ${this.chainId}:`, JSON.stringify(error));
    }
  }

  return result;
}

export { getAccountState };
