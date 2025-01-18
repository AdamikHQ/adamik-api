import { MINTSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { COSMOS_TOKENS } from "~/app/config/tokens/cosmos";
import {
  ChainId,
  StakingPosition,
  StakingReward,
  StakingStatus,
  TokenStakingReward,
  TokenType,
} from "~/app/model/types_WIP";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { CosmosChainParams, IBCToken } from "../types";
import {
  CosmosAccount,
  CosmosBalance,
  CosmosDelegation,
  CosmosRewards,
  CosmosUnbondingDelegation,
  CosmosValidator,
} from "./types";

const getNodeRootUrl = (chainId: ChainId) => CHAINS[chainId].backends.nodeURL;

async function fetchWithHeaders(chainId: ChainId, url: string, defaultOptions: RequestInit = {}) {
  const options: RequestInit = {
    ...defaultOptions,
    headers: {
      ...defaultOptions.headers,
      ...(url.includes("apis.mintscan.io") && { Authorization: MINTSCAN_API_KEY }),
      // Custom header requested by imperator.co to identify and whitelist our traffic
      ...(url.includes("imperator.co") && { adamik: "6aPJgGeL2jHcNG7PaW4y" }),
    },
  };

  const data = await fetch(url, options);

  if (!data.ok) {
    console.warn(`/!\\ Error received from ${chainId} node endpoint ${url.toString()}:`, await data.text());
    throw new ThirdPartyProviderError("Error while fetching data from the node");
  }

  return await data.json();
}

async function fetchAllWithPagination<T>(chainId: ChainId, urlString: string, dataKey: string): Promise<T[]> {
  const url = new URL(urlString);

  let data: T[] = [];
  let result;
  do {
    if (result?.pagination?.next_key) {
      url.searchParams.set("pagination.key", result.pagination.next_key);
    }

    result = await fetchWithHeaders(chainId, url.toString());

    if (!result || !Array.isArray(result[dataKey])) {
      console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint: ${url.toString()}:`, result);
      break;
    }

    data = data.concat(result[dataKey]);
  } while (result?.pagination?.next_key);

  return data;
}

// NOTE Unused, we rely on the explorer (mintscan) for that
/*
async function fetchTransaction(chainId: ChainId, transactionId: string): Promise<CosmosTransaction | null> {
  const url = `${getRootUrl(chainId)}/cosmos/tx/v1beta1/txs/${transactionId}`;

  const data = await fetchWithHeaders(url);

  if ("message" in data) {
    return null;
  }

  return data.tx_response;
}
*/

async function fetchBalances(chainId: ChainId, address: string): Promise<CosmosBalance[]> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/bank/v1beta1/balances/${address}`;

  return await fetchAllWithPagination<CosmosBalance>(chainId, url, "balances");
}

async function fetchDelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/staking/v1beta1/delegations/${address}`;

  const delegationsData = await fetchAllWithPagination<CosmosDelegation>(
    chainId,
    url,
    "delegation_responses"
  );

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
/*
async function fetchRedelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/staking/v1beta1/delegators/${address}/redelegations`;

  const redelegationsData = await fetchAllWithPagination<CosmosRedelegation>(
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
*/

async function fetchUnbondingDelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`;

  const unbondingsData = await fetchAllWithPagination<CosmosUnbondingDelegation>(
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
  const url = `${getNodeRootUrl(chainId)}/cosmos/distribution/v1beta1/delegators/${address}/rewards`;

  // (Note: this endpoint is not paginated)
  const data: CosmosRewards = await fetchWithHeaders(chainId, url);

  if (!data?.rewards) {
    console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint: ${url}:`, data);
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
        const token = COSMOS_TOKENS.find((token) => token.denom === denom) as IBCToken;
        if (token) {
          tokenRewards.push({
            validatorAddress,
            amount,
            token: {
              type: TokenType.IBC,
              id: denom,
              name: token.symbol,
              ticker: token.symbol,
              decimals: token.decimals,
            },
          });
        } else {
          console.warn(`/!\\ Missing info about IBC token '${denom}':`);
        }
      }
    }
  }

  return {
    native: nativeRewards,
    tokens: tokenRewards,
  };
}

async function fetchValidators(
  chainId: ChainId,
  paginationToken?: string
): Promise<{ validators: CosmosValidator[]; nextPage: string | null }> {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;
  const chainIdForValidators = chainParams.isICS ? ChainId.COSMOSHUB : chainId;

  const url = new URL(`${getNodeRootUrl(chainIdForValidators)}/cosmos/staking/v1beta1/validators`);

  const paginationData = paginationFromB64(paginationToken);

  if (paginationData) {
    if (typeof paginationData === "string") {
      url.searchParams.set("pagination.key", paginationData);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const data = await fetchWithHeaders(chainId, url.toString());

  if (data?.message === "illegal base64 data at input byte 4") {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }

  if (!Array.isArray(data?.validators)) {
    console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint: ${url.toString()}:`, data);
    throw new ThirdPartyProviderError(`Error while fetching ${chainId} validators from the node`);
  }

  return {
    validators: data.validators,
    nextPage: paginationToB64(data.pagination.next_key),
  };
}

async function fetchAccount(chainId: ChainId, address: string): Promise<CosmosAccount> {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;

  const account: CosmosAccount = {
    accountNumber: 0n,
    sequence: 0n,
    pubKeyType: chainParams?.defaultPubKeyType || "",
    pubKey: "",
  };

  const url = `${getNodeRootUrl(chainId)}/cosmos/auth/v1beta1/accounts/${address}`;

  const data = await fetchWithHeaders(chainId, url);

  try {
    // We use base_account for Ethermint chains and account for the rest
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
  } catch (e) {
    console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint: ${url}:`, data);
    throw new ThirdPartyProviderError(`Error while fetching ${chainId} account info from the node`);
  }

  return account;
}

// NOTE Unused at the moment, all IBC token infos are retrieved from src/app/config/tokens/cosmos.ts
/*
async function fetchIBCTokenTicker(chainId: ChainId, ibcTokenId: string): Promise<string> {
  const url = `${getNodeRootUrl(chainId)}/ibc/apps/transfer/v1/denom_traces/${ibcTokenId}`;

  const data = await fetchWithHeaders(url);
  if (!data?.denom_trace?.base_denom) {
    console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint: ${url}:`, data);
    return "";
  }

  return data.denom_trace.base_denom;
}
*/

// NOTE Unneeded, we rely on hardcoded 'nativeId' in chains configs
/*
async function fetchNetworkId(chainId: ChainId): Promise<string> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/base/tendermint/v1beta1/node_info`;
  const data = await fetchWithHeaders(chainId, url);
  if (!data?.default_node_info?.network) {
    console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint: ${url}:`, data);
    throw new ThirdPartyProviderError(`Error while fetching ${chainId} network ID from the node`);
  }

  return data.default_node_info.network;
}
*/

async function simulateTransaction(chainId: ChainId, payload: string): Promise<bigint> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/tx/v1beta1/simulate`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  const data = await fetchWithHeaders(chainId, url, options);

  if (!data?.gas_info?.gas_used) {
    console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint: ${url}:`, data);
    throw new ThirdPartyProviderError("Error while getting gas estimate from the node");
  }

  return BigInt(data.gas_info.gas_used);
}

async function broadcastTransaction(chainId: ChainId, payload: string): Promise<string> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/tx/v1beta1/txs`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  const data = await fetchWithHeaders(chainId, url, options);

  // TODO We could return more detailed error messages using
  // error codes in https://github.com/cosmos/cosmos-sdk/blob/main/types/errors/errors.go
  if (data?.tx_response?.code || !data?.tx_response?.txhash) {
    const errorMessage = `Broadcast on ${chainId} node returned invalid data`;

    console.warn(`/!\\ ${errorMessage}: ${JSON.stringify(data)}`);
    throw new ThirdPartyProviderError(errorMessage);
  }

  return data.tx_response.txhash;
}

export {
  broadcastTransaction,
  fetchAccount,
  fetchBalances,
  fetchDelegations,
  fetchRewards,
  fetchUnbondingDelegations,
  fetchValidators,
  simulateTransaction,
};
