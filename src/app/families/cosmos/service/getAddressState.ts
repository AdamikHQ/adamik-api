import { AddressState, StakingPosition, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { CHAINS } from "~/app/config/chains";
import { COSMOS_TOKENS } from "~/app/config/tokens/cosmos";
import { CosmosBalance } from "../backend/types";
import { fetchBalances, fetchDelegations, fetchRewards, fetchUnbondingDelegations } from "../backend/node";
import { CosmosService } from ".";
import { CosmosParams, IBCToken } from "../types";

async function getAddressState(this: CosmosService, address: string): Promise<AddressState> {
  const balances: CosmosBalance[] = await fetchBalances(this.chainId, address);

  const chain = CHAINS[this.chainId];
  const chainParams = chain.params as CosmosParams;

  let nativeBalance = 0n;
  let tokenBalances: TokenAmount[] = [];
  for (const item of balances) {
    if (item.denom === chainParams?.denom) {
      // Native
      nativeBalance += BigInt(item.amount);

      // FIXME Should maybe remove this additional condition?
      // as some IBC tokens ids seem to not include the "ibc/" prefix
    } else if (item.denom.startsWith("ibc/")) {
      // Tokens
      const token = COSMOS_TOKENS.find((token) => token.denom === item.denom) as IBCToken;

      if (token) {
        tokenBalances.push({
          amount: BigInt(item.amount),
          token: {
            chainId: this.chainId,
            type: TokenType.IBC,
            id: token.denom,
            name: token.symbol,
            ticker: token.symbol,
            decimals: token.decimals,
          },
        });
      } else {
        console.warn(`/!\\ Could not find info about IBC token '${item.denom}':`);
      }
    }
  }

  // Staking

  const [delegations, unbondings, rewards] = await Promise.all([
    fetchDelegations(this.chainId, address),
    fetchUnbondingDelegations(this.chainId, address),
    fetchRewards(this.chainId, address),
  ]);

  const lockedBalance = delegations.reduce((sum, delegation) => sum + delegation.amount, 0n);
  const unlockingBalance = unbondings.reduce((sum, unbonding) => sum + unbonding.amount, 0n);

  const positions: StakingPosition[] = delegations.concat(unbondings);

  const { native: nativeRewards, tokens: tokenRewards } = rewards;

  return {
    chainId: this.chainId,
    address,
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance + lockedBalance + unlockingBalance,
      },
      tokens: tokenBalances,
      staking: {
        total: lockedBalance + unlockingBalance,
        locked: lockedBalance,
        unlocking: unlockingBalance,
        unlocked: 0n, // Meaningless for Cosmos
        positions,
        rewards: {
          native: nativeRewards,
          tokens: tokenRewards,
        },
      },
    },
  };
}

export { getAddressState };
