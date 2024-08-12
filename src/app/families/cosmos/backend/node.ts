import TTLCache from "@isaacs/ttlcache";
import { CHAINS } from "~/app/config/chains";
import {
  CosmosAccount,
  CosmosBalance,
  CosmosDelegation,
  CosmosRedelegation,
  CosmosRewards,
  CosmosUnbondingDelegation,
  CosmosValidator,
} from "./types";
import {
  ChainId,
  Pagination,
  StakingPosition,
  StakingReward,
  TokenStakingReward,
  StakingStatus,
} from "~/app/model/types_WIP";
import { CosmosChainParams } from "../types";

// Cache to store validators with a TTL (time-to-live) of 1 hour
const VALIDATORS_CACHE = new TTLCache<string, CosmosValidator[]>({
  max: 1, // Only need one item
  ttl: 1000 * 60 * 60, // Cache expiration = 1 hour
});

const getRootUrl = (chainId: ChainId) => CHAINS[chainId].backends.nodeURL;

async function fetchWithPagination<T>(chainId: ChainId, urlString: string, dataKey: string) {
  const url = new URL(urlString);

  let data: T[] = [];
  let response;
  do {
    if (response?.pagination?.next_key) {
      url.searchParams.set("pagination.key", response.pagination.next_key);
    }

    response = await fetch(url.toString()).then((response) => response.json());

    if (!response || !Array.isArray(response[dataKey])) {
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url.toString()}:`, response);
      break;
    }

    data = data.concat(response[dataKey]);
  } while (response?.pagination?.next_key);

  return data;
}

async function fetchBalances(chainId: ChainId, address: string): Promise<CosmosBalance[]> {
  const url = `${getRootUrl(chainId)}/cosmos/bank/v1beta1/balances/${address}`;
  try {
    const balances = await fetchWithPagination<CosmosBalance>(chainId, url, "balances");
    console.log(`Balances for chainID ${chainId}:`, balances);
    return balances;
  } catch (error) {
    console.error(`Error fetching balances for chainID ${chainId}:`, error);
    return []; // Return an empty array for balances
  }
}

async function fetchDelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getRootUrl(chainId)}/cosmos/staking/v1beta1/delegations/${address}`;
  try {
    const delegationsData = await fetchWithPagination<CosmosDelegation>(chainId, url, "delegation_responses");
    const delegations = delegationsData.map((delegation) => {
      return {
        validatorAddresses: [delegation.delegation.validator_address],
        amount: BigInt(delegation.balance.amount),
        status: StakingStatus.LOCKED,
      };
    });
    console.log(`Delegations for chainID ${chainId}:`, delegations);
    return delegations;
  } catch (error) {
    console.error(`Error fetching delegations for chainID ${chainId}:`, error);
    return []; // Return an empty array for delegations
  }
}

async function fetchRedelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getRootUrl(chainId)}/cosmos/staking/v1beta1/delegators/${address}/redelegations`;
  try {
    const redelegationsData = await fetchWithPagination<CosmosRedelegation>(
      chainId,
      url,
      "redelegation_responses"
    );

    const redelegations: StakingPosition[] = [];
    for (const { entries, redelegation } of redelegationsData) {
      for (const entry of entries) {
        const {
          redelegation_entry: { initial_balance: initialBalance, completion_time: completionTime },
        } = entry;

        redelegations.push({
          validatorAddresses: [redelegation.validator_dst_address],
          amount: BigInt(initialBalance),
          status: StakingStatus.LOCKED,
          completionDate: new Date(completionTime).getTime(),
        });
      }
    }
    console.log(`Redelegations for chainID ${chainId}:`, redelegations);
    return redelegations;
  } catch (error) {
    console.error(`Error fetching redelegations for chainID ${chainId}:`, error);
    return []; // Return an empty array for redelegations
  }
}

async function fetchUnbondingDelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getRootUrl(chainId)}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`;
  try {
    const unbondingsData = await fetchWithPagination<CosmosUnbondingDelegation>(
      chainId,
      url,
      "unbonding_responses"
    );

    const unbondings: StakingPosition[] = [];
    for (const { validator_address: validatorAddress, entries } of unbondingsData) {
      for (const { initial_balance: initialBalance, completion_time: completionTime } of entries) {
        unbondings.push({
          validatorAddresses: [validatorAddress],
          amount: BigInt(initialBalance),
          status: StakingStatus.UNLOCKING,
          completionDate: new Date(completionTime).getTime(),
        });
      }
    }
    console.log(`Unbonding Delegations for chainID ${chainId}:`, unbondings);
    return unbondings;
  } catch (error) {
    console.error(`Error fetching unbonding delegations for chainID ${chainId}:`, error);
    return []; // Return an empty array for unbonding delegations
  }
}

async function fetchRewards(
  chainId: ChainId,
  address: string
): Promise<{ native: StakingReward[]; tokens: TokenStakingReward[] }> {
  const url = `${getRootUrl(chainId)}/cosmos/distribution/v1beta1/delegators/${address}/rewards`;
  try {
    // Fetch the rewards data, no pagination needed here
    const data: CosmosRewards = await fetch(url).then((response) => response.json());
    if (!data?.rewards) {
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
      return { native: [], tokens: [] };
    }

    const rewardsData = data.rewards;
    const nativeRewards: StakingReward[] = [];
    const tokenRewards: TokenStakingReward[] = [];
    const chainParams = CHAINS[chainId].params as CosmosChainParams;

    for (const { reward: rewardData, validator_address: validatorAddress } of rewardsData) {
      for (const { denom, amount: amountWithDecimals } of rewardData) {
        const amount = BigInt(amountWithDecimals.split(".")[0]);
        if (amount === 0n) {
          continue; // Skip dust amounts
        }

        if (denom === chainParams.denom) {
          nativeRewards.push({
            validatorAddress,
            amount,
          });
        } else if (denom.startsWith("ibc/")) {
          tokenRewards.push({
            tokenId: denom,
            validatorAddress,
            amount,
          });
        }
      }
    }
    console.log(`Rewards for chainID ${chainId}:`, { native: nativeRewards, tokens: tokenRewards });
    return {
      native: nativeRewards,
      tokens: tokenRewards,
    };
  } catch (error) {
    console.error(`Error fetching rewards for chainID ${chainId}:`, error);
    return { native: [], tokens: [] }; // Return an empty result for rewards
  }
}

async function fetchAllValidators(chainId: ChainId): Promise<CosmosValidator[]> {
  const url = `${getRootUrl(chainId)}/cosmos/staking/v1beta1/validators`;
  try {
    const validators = await fetchWithPagination<CosmosValidator>(chainId, url, "validators");
    console.log(`Validators for chainID ${chainId}:`, validators);
    return validators;
  } catch (error) {
    console.error(`Error fetching validators for chainID ${chainId}:`, error);
    return []; // Return an empty array for validators
  }
}

async function getValidatorsCached(chainId: ChainId, pagination?: Pagination): Promise<CosmosValidator[]> {
  const cacheKey = `validators-${chainId}`;
  try {
    if (!VALIDATORS_CACHE.has(cacheKey)) {
      // If the cache is empty, fetch the validators from the network
      const newValidators = await fetchAllValidators(chainId);
      VALIDATORS_CACHE.set(cacheKey, newValidators);
    }

    const validators = VALIDATORS_CACHE.get(cacheKey) || [];
    const paginatedValidators = pagination
      ? validators.slice(pagination.offset, pagination.offset + pagination.limit)
      : validators;
    console.log(`Cached validators for chainID ${chainId}:`, paginatedValidators);
    return paginatedValidators;
  } catch (error) {
    console.error(`Error fetching cached validators for chainID ${chainId}:`, error);
    return []; // Return an empty array for cached validators
  }
}

async function fetchAccount(chainId: ChainId, address: string): Promise<CosmosAccount> {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;
  const account: CosmosAccount = {
    accountNumber: 0n,
    sequence: 0n,
    pubKeyType: chainParams?.defaultPubKeyType || "",
    pubKey: "",
  };

  const url = `${getRootUrl(chainId)}/cosmos/auth/v1beta1/accounts/${address}`;
  try {
    const data = await fetch(url).then((response) => response.json());
    try {
      // Handle Ethermint chains differently by checking for base_account
      const accountData = data.account.base_account || data.account;

      if (accountData.account_number) {
        account.accountNumber = BigInt(accountData.account_number);
      }

      if (accountData.sequence) {
        account.sequence = BigInt(accountData.sequence);
      }

      if (accountData.pub_key) {
        account.pubKey = accountData.pub_key.key;
        account.pubKeyType = accountData.pub_key["@type"];
      }

      // Log the fetched account data
      console.log(`Account data for chainID ${chainId}:`, account);
    } catch (e) {
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
      throw new Error(`Error while fetching ${chainId} account info from the node`);
    }
    return account;
  } catch (error) {
    console.error(`Error fetching account for chainID ${chainId}:`, error);
    return {
      accountNumber: 0n,
      sequence: 0n,
      pubKeyType: chainParams?.defaultPubKeyType || "",
      pubKey: "",
    }; // Return an empty account object
  }
}

async function fetchIBCTokenTicker(chainId: ChainId, ibcTokenId: string): Promise<string> {
  const url = `${getRootUrl(chainId)}/ibc/apps/transfer/v1/denom_traces/${ibcTokenId}`;
  try {
    const data = await fetch(url).then((response) => response.json());
    if (!data?.denom_trace?.base_denom) {
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
      return "";
    }
    const baseDenom = data.denom_trace.base_denom;
    // Log the IBC token ticker information
    console.log(`IBC Token Ticker for chainID ${chainId}, tokenId ${ibcTokenId}:`, baseDenom);
    return baseDenom;
  } catch (error) {
    console.error(`Error fetching IBC token ticker for chainID ${chainId}, tokenId ${ibcTokenId}:`, error);
    return ""; // Return an empty string
  }
}

async function fetchNetworkId(chainId: ChainId): Promise<string> {
  const url = `${getRootUrl(chainId)}/cosmos/base/tendermint/v1beta1/node_info`;
  try {
    const data = await fetch(url).then((response) => response.json());
    if (!data?.default_node_info?.network) {
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
      return "";
    }
    const networkId = data.default_node_info.network;
    // Log the fetched network ID
    console.log(`Network ID for chainID ${chainId}:`, networkId);
    return networkId;
  } catch (error) {
    console.error(`Error fetching network ID for chainID ${chainId}:`, error);
    return ""; // Return an empty string
  }
}

async function simulateTransaction(chainId: ChainId, payload: string): Promise<bigint> {
  const url = `${getRootUrl(chainId)}/cosmos/tx/v1beta1/simulate`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  try {
    const data = await fetch(url, options).then((response) => response.json());

    if (!data?.gas_info?.gas_used) {
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
      throw new Error("Error while getting gas estimate from the node");
    }

    const gasUsed = BigInt(data.gas_info.gas_used);
    // Log the gas estimate
    console.log(`Gas estimate for chainID ${chainId}:`, gasUsed);
    return gasUsed;
  } catch (error) {
    console.error(`Error simulating transaction for chainID ${chainId}:`, error);
    return 0n; // Return zero gas used
  }
}

async function broadcastTransaction(chainId: ChainId, payload: string): Promise<string> {
  const url = `${getRootUrl(chainId)}/cosmos/tx/v1beta1/txs`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  try {
    const data = await fetch(url, options).then((response) => response.json());

    if (data?.tx_response?.code || !data?.tx_response?.txhash) {
      const errorMessage = `Invalid response from broadcast on ${chainId} node (code: ${
        data?.tx_response?.code || "?"
      }, message: '${data?.tx_response?.raw_log || ""}')`;

      console.warn("/!\\ " + errorMessage);
      throw new Error(errorMessage);
    }

    const txHash = data.tx_response.txhash;
    // Log the transaction hash after broadcasting
    console.log(`Transaction broadcast for chainID ${chainId}, txHash:`, txHash);
    return txHash;
  } catch (error) {
    console.error(`Error broadcasting transaction for chainID ${chainId}:`, error);
    return ""; // Return an empty string for txHash
  }
}

export {
  fetchBalances,
  fetchAccount,
  fetchDelegations,
  fetchUnbondingDelegations,
  fetchRewards,
  fetchNetworkId,
  simulateTransaction,
  broadcastTransaction,
  getValidatorsCached,
};
