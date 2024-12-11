import { ChainId as CosmosChainId } from "@injectivelabs/ts-types";
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
import { paginationFromB64, paginationToB64 } from "~/app/tools/convertors/pagination";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
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

async function fetchWithHeaders(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      // Custom header requested by imperator.co to identify and whitelist our traffic
      ...(url.includes("imperator.co") && {
        adamik: "6aPJgGeL2jHcNG7PaW4y",
      }),
      ...(url.includes("apis.mintscan.io") && {
        Authorization: MINTSCAN_API_KEY,
      }),
    },
  };
  return fetch(url, defaultOptions);
}

async function fetchAllWithPagination<T>(chainId: ChainId, urlString: string, dataKey: string): Promise<T[]> {
  const url = new URL(urlString);

  let data: T[] = [];
  let response;
  do {
    if (response?.pagination?.next_key) {
      url.searchParams.set("pagination.key", response.pagination.next_key);
    }

    response = await fetchWithHeaders(url.toString()).then((response) => response.json());

    if (!response || !Array.isArray(response[dataKey])) {
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url.toString()}:`, response);
      break;
    }

    data = data.concat(response[dataKey]);
  } while (response?.pagination?.next_key);

  return data;
}

// NOTE Unused, we rely on the explorer (mintscan) for that
/*
async function fetchTransaction(chainId: ChainId, transactionId: string): Promise<CosmosTransaction | null> {
  const url = `${getRootUrl(chainId)}/cosmos/tx/v1beta1/txs/${transactionId}`;

  const response = await fetchWithHeaders(url).then((response) => response.json());

  if ("message" in response) {
    return null;
  }

  return response.tx_response;
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
  const data: CosmosRewards = await fetchWithHeaders(url).then((response) => response.json());
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
              chainId: chainId,
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

  const response = await fetchWithHeaders(url.toString()).then((response) => response.json());

  if (response?.message === "illegal base64 data at input byte 4") {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }

  if (!Array.isArray(response?.validators)) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url.toString()}:`, response);
    throw new ThirdPartyProviderError(`Error while fetching ${chainId} validators from the node`);
  }

  return {
    validators: response.validators,
    nextPage: paginationToB64(response.pagination.next_key),
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

  const data = await fetchWithHeaders(url).then((response) => response.json());

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
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
    throw new ThirdPartyProviderError(`Error while fetching ${chainId} account info from the node`);
  }

  return account;
}

// NOTE Unused at the moment, all IBC token infos are retrieved from src/app/config/tokens/cosmos.ts
/*
async function fetchIBCTokenTicker(chainId: ChainId, ibcTokenId: string): Promise<string> {
  const url = `${getNodeRootUrl(chainId)}/ibc/apps/transfer/v1/denom_traces/${ibcTokenId}`;

  const data = await fetchWithHeaders(url).then((response) => response.json());
  if (!data?.denom_trace?.base_denom) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
    return "";
  }

  return data.denom_trace.base_denom;
}
*/

async function fetchNetworkId(chainId: ChainId): Promise<CosmosChainId> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/base/tendermint/v1beta1/node_info`;
  const data = await fetchWithHeaders(url).then((response) => response.json());
  if (!data?.default_node_info?.network) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
    throw new ThirdPartyProviderError(`Error while fetching ${chainId} network ID from the node`);
  }

  return data.default_node_info.network;
}

async function simulateTransaction(chainId: ChainId, payload: string): Promise<bigint> {
  const url = `${getNodeRootUrl(chainId)}/cosmos/tx/v1beta1/simulate`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  const data = await fetchWithHeaders(url, options).then((response) => response.json());

  if (!data?.gas_info?.gas_used) {
    console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url}:`, data);
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

  const data = await fetchWithHeaders(url, options).then((response) => response.json());

  if (data?.tx_response?.code || !data?.tx_response?.txhash) {
    // error codes: https://github.com/cosmos/cosmos-sdk/blob/master/types/errors/errors.go
    const errorMessage = `Invalid response from broadcast on ${chainId} node (code: ${
      data?.tx_response?.code || "?"
    }, message: '${data?.tx_response?.raw_log || ""}')`;

    console.warn("/!\\ " + errorMessage);
    throw new ThirdPartyProviderError(errorMessage);
  }

  return data.tx_response.txhash;
}

export {
  broadcastTransaction,
  fetchAccount,
  fetchBalances,
  fetchDelegations,
  fetchNetworkId,
  fetchRewards,
  fetchUnbondingDelegations,
  fetchValidators,
  simulateTransaction,
};
