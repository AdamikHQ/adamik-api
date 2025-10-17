import { SOLSCAN_API_KEY } from "~/app/config/apiKeys";
import { ChainId, ProviderType, StakingPosition, StakingReward, StakingStatus } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { getProviderUrls } from "../../common";
import { SolscanAccountStakeResponse } from "./solscan.types";

const getSolscanBaseUrl = (chainId: ChainId) => {
  return getProviderUrls(chainId, ProviderType.solscan)[0];
};

function mapSolscanStatusToStakingStatus(solscanStatus: string): StakingStatus {
  switch (solscanStatus.toLowerCase()) {
    case "active":
      return StakingStatus.LOCKED;
    case "inactive":
      return StakingStatus.UNLOCKED;
    case "activating":
      return StakingStatus.PENDING;
    case "deactivating":
      return StakingStatus.UNLOCKING;
    default:
      // Default to LOCKED for unknown statuses
      return StakingStatus.LOCKED;
  }
}

async function fetchStakingPositions(
  chainId: ChainId,
  accountId: string
): Promise<{ stakingPositions: StakingPosition[]; stakingRewards: StakingReward[] }> {
  const baseUrl = getSolscanBaseUrl(chainId);

  const url = new URL(`${baseUrl}/account/stake`);

  url.searchParams.append("address", accountId);

  let response: Response;
  let result: SolscanAccountStakeResponse;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        token: SOLSCAN_API_KEY,
      },
    });

    result = await response.json();
  } catch (error) {
    console.warn(`/!\\ Error received from Solscan API endpoint '${url}':`, error);
    throw new ThirdPartyProviderError(`Error while fetching account stake data for ${chainId}`);
  }

  if (!response?.ok || !result?.success) {
    console.warn(
      `/!\\ Invalid response received from Solscan API endpoint '${url}':`,
      result ?? response.statusText
    );
    throw new ThirdPartyProviderError(`Error while fetching account stake data for ${chainId}`);
  }

  const stakeAccounts = result.data || [];

  const stakingPositions: StakingPosition[] = [];
  const stakingRewards: StakingReward[] = [];

  for (const stakeAccount of stakeAccounts) {
    // Delegated stake
    stakingPositions.push({
      validatorAddresses: [stakeAccount.voter],
      amount: BigInt(stakeAccount.delegated_stake_amount),
      status: mapSolscanStatusToStakingStatus(stakeAccount.status),
      stakeId: stakeAccount.stake_account,
    });

    // Remaining balance on the stake account
    stakingPositions.push({
      validatorAddresses: [stakeAccount.voter],
      amount: BigInt(stakeAccount.sol_balance),
      status: StakingStatus.FREE,
      stakeId: stakeAccount.stake_account,
    });

    // Rewards, if there are any
    if (stakeAccount.total_reward && BigInt(stakeAccount.total_reward) > 0n) {
      stakingRewards.push({
        validatorAddress: stakeAccount.voter,
        amount: BigInt(stakeAccount.total_reward),
      });
    }
  }

  return { stakingPositions, stakingRewards };
}

export { fetchStakingPositions };
