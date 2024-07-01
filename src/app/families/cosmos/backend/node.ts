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
import { CosmosParams } from "../types";

const VALIDATORS_CACHE = new TTLCache<string, CosmosValidator[]>({
  max: 1, // Only need one item
  ttl: 1000 * 60 * 60, // Cache expiration = 1h
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
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url.toString()}`);
      break;
    }

    data = data.concat(response[dataKey]);
  } while (response?.pagination?.next_key);

  return data;
}

async function fetchBalances(chainId: ChainId, address: string): Promise<CosmosBalance[]> {
  const url = `${getRootUrl(chainId)}/cosmos/bank/v1beta1/balances/${address}`;

  return await fetchWithPagination<CosmosBalance>(chainId, url, "balances");
}

async function fetchDelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getRootUrl(chainId)}/cosmos/staking/v1beta1/delegations/${address}`;

  const delegationsData = await fetchWithPagination<CosmosDelegation>(chainId, url, "delegation_responses");

  return delegationsData.map((delegation) => {
    return {
      validatorAddresses: [delegation.delegation.validator_address],
      amount: BigInt(delegation.balance.amount),
      status: StakingStatus.LOCKED,
    };
  });
}

// NOTE This is unused at the moment, as redelegations are also included in the delegations
// (missing specific info such as the destination validator, but we don't need it for now)
async function fetchRedelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getRootUrl(chainId)}/cosmos/staking/v1beta1/delegators/${address}/redelegations`;

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
        // NOTE redelegation.validator_src_address is ignored at the moment,
        // no distinction made between re/delegation. TBD if it is important or not.
        validatorAddresses: [redelegation.validator_dst_address],
        amount: BigInt(initialBalance),
        status: StakingStatus.LOCKED,
        completionDate: new Date(completionTime).getTime(),
      });
    }
  }

  return redelegations;
}

async function fetchUnbondingDelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getRootUrl(chainId)}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`;

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

  return unbondings;
}

async function fetchRewards(
  chainId: ChainId,
  address: string
): Promise<{ native: StakingReward[]; tokens: TokenStakingReward[] }> {
  const url = `${getRootUrl(chainId)}/cosmos/distribution/v1beta1/delegators/${address}/rewards`;

  // (Note: this endpoint is not paginated)
  const data: CosmosRewards = await fetch(url).then((response) => response.json());
  if (!data?.rewards) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}`);
    return { native: [], tokens: [] };
  }

  const rewardsData = data.rewards;

  const nativeRewards: StakingReward[] = [];
  const tokenRewards: TokenStakingReward[] = [];
  const chainParams = CHAINS[chainId].params as CosmosParams;

  for (const { reward: rewardData, validator_address: validatorAddress } of rewardsData) {
    for (const { denom, amount: amountWithDecimals } of rewardData) {
      const amount = BigInt(amountWithDecimals.split(".")[0]);
      if (amount === 0n) {
        // For now we always filter-out dust amounts to lighten the reponse,
        // but should rather be controlled with a request param
        // TODO https://adamik.atlassian.net/browse/ADV-150
        continue;
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

  return {
    native: nativeRewards,
    tokens: tokenRewards,
  };
}

async function fetchAllValidators(chainId: ChainId): Promise<CosmosValidator[]> {
  const url = `${getRootUrl(chainId)}/cosmos/staking/v1beta1/validators`;

  return await fetchWithPagination<CosmosValidator>(chainId, url, "validators");
}

async function getValidatorsCached(chainId: ChainId, pagination?: Pagination): Promise<CosmosValidator[]> {
  const cacheKey = `validators-${chainId}`;

  if (!VALIDATORS_CACHE.has(cacheKey)) {
    const newValidators = await fetchAllValidators(chainId);
    VALIDATORS_CACHE.set(cacheKey, newValidators);
  }

  const validators = VALIDATORS_CACHE.get(cacheKey) || [];

  return pagination ? validators.slice(pagination.offset, pagination.offset + pagination.limit) : validators;
}

async function fetchAccount(chainId: ChainId, address: string): Promise<CosmosAccount> {
  const chainParams = CHAINS[chainId].params as CosmosParams;

  const accountData: CosmosAccount = {
    accountNumber: 0n,
    sequence: 0n,
    pubKeyType: chainParams?.defaultPubKeyType || "",
    pubKey: "",
  };

  const url = `${getRootUrl(chainId)}/cosmos/auth/v1beta1/accounts/${address}`;

  try {
    const data = await fetch(url).then((response) => response.json());

    // We use base_account for Ethermint chains and account for the rest
    const srcAccount = data.account.base_account || data.account;

    if (srcAccount.account_number) {
      accountData.accountNumber = BigInt(srcAccount.account_number);
    }

    if (srcAccount.sequence) {
      accountData.sequence = BigInt(srcAccount.sequence);
    }

    if (srcAccount.pub_key) {
      accountData.pubKey = srcAccount.pub_key.key;
      accountData.pubKeyType = srcAccount.pub_key["@type"];
    }
  } catch (e) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}`);
    throw new Error(`Error while fetching ${chainId} account info from the node`);
  }

  return accountData;
}

// NOTE Unused at the moment, all IBC token infos are retrieved from src/app/config/tokens/cosmos.ts
async function fetchIBCTokenTicker(chainId: ChainId, ibcTokenId: string): Promise<string> {
  const url = `${getRootUrl(chainId)}/ibc/apps/transfer/v1/denom_traces/${ibcTokenId}`;

  const data = await fetch(url).then((response) => response.json());
  if (!data?.denom_trace?.base_denom) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}`);
    return "";
  }

  return data.denom_trace.base_denom;
}

async function fetchNetworkId(chainId: ChainId): Promise<string> {
  const url = `${getRootUrl(chainId)}/cosmos/base/tendermint/v1beta1/node_info`;
  const data = await fetch(url).then((response) => response.json());
  if (!data?.default_node_info?.network) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}`);
    return "";
  }

  return data.default_node_info.network;
}

async function simulateTransaction(chainId: ChainId, payload: string): Promise<bigint> {
  const url = `${getRootUrl(chainId)}/cosmos/tx/v1beta1/simulate`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  const data = await fetch(url, options).then((response) => response.json());
  if (!data?.gas_info?.gas_used) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}`);
    throw new Error("Error while getting gas estimate from the node");
  }

  return BigInt(data.gas_info.gas_used);
}

async function broadcastTransaction(chainId: ChainId, payload: string): Promise<string> {
  const url = `${getRootUrl(chainId)}/cosmos/tx/v1beta1/txs`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  const data = await fetch(url, options).then((response) => response.json());

  if (data?.tx_response?.code || !data?.tx_response?.txhash) {
    // error codes: https://github.com/cosmos/cosmos-sdk/blob/master/types/errors/errors.go
    const errorMessage = `Invalid response from broadcast on ${chainId} node (code: ${
      data?.tx_response?.code || "?"
    }, message: '${data?.tx_response?.raw_log || ""}')`;

    console.warn("/!\\ " + errorMessage);
    throw new Error(errorMessage);
  }

  return data.tx_response.txhash;
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
