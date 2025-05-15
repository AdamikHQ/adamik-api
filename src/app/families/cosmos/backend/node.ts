import { MINTSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { COSMOS_TOKENS } from "~/app/config/tokens/cosmos";
import {
  ChainId,
  ProviderType,
  StakingPosition,
  StakingReward,
  StakingStatus,
  TokenStakingReward,
  TokenType,
} from "~/app/model/types_WIP";
import { statusFromMessage } from "~/app/tools/handlers/apiHandler";
import {
  BabylonInvalidProofOfPossessionError,
  BabylonTransactionAlreadyUsedError,
  InvalidPaginationTokenError,
  InvalidTransactionError,
  ThirdPartyProviderError,
  UserInputError,
} from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { getProviderUrls } from "../../common";
import { CosmosChainParams, IBCToken } from "../types";
import {
  CosmosAccount,
  CosmosBalance,
  CosmosDelegation,
  CosmosRewards,
  CosmosUnbondingDelegation,
  CosmosValidator,
} from "./types";

async function fetchWithHeaders(url: string, customOptions: RequestInit = {}) {
  const options: RequestInit = {
    ...customOptions,
    headers: {
      ...customOptions.headers,
      ...(url.includes("apis.mintscan.io") && { Authorization: MINTSCAN_API_KEY }),
      // Custom header requested by imperator.co to identify and whitelist our traffic
      ...(url.includes("imperator.co") && { adamik: "6aPJgGeL2jHcNG7PaW4y" }),
    },
  };

  return fetch(url, options);
}

async function fetchAllWithPagination<T>(chainId: ChainId, urlString: string, dataKey: string): Promise<T[]> {
  const url = new URL(urlString);

  let data: T[] = [];
  let result;
  do {
    if (result && result.pagination?.next_key) {
      url.searchParams.set("pagination.key", result.pagination.next_key);
    }

    const response = await fetchWithHeaders(url.toString());

    if (!response.ok) {
      console.warn(
        `/!\\ Error received from ${chainId} node endpoint ${url.toString()}:`,
        await response.text()
      );
      throw new ThirdPartyProviderError("Error while fetching data from the node");
    }

    result = await response.json();

    if (!result || !Array.isArray(result[dataKey])) {
      console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint ${url.toString()}:`, result);
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
  const baseURL = getProviderUrls(chainId, ProviderType.node);
  const urls = baseURL.map((url) => `${url}/cosmos/bank/v1beta1/balances/${address}`);

  for (const url of urls) {
    try {
      return await fetchAllWithPagination<CosmosBalance>(chainId, url, "balances");
    } catch (error) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, error);
    }
  }

  throw new ThirdPartyProviderError(`Error while fetching balances for ${chainId}`);
}

async function fetchDelegations(chainId: ChainId, address: string): Promise<StakingPosition[]> {
  const baseURL = getProviderUrls(chainId, ProviderType.node);
  const urls = baseURL.map((url) => `${url}/cosmos/staking/v1beta1/delegations/${address}`);

  for (const url of urls) {
    let delegationsData: CosmosDelegation[] | undefined;
    try {
      delegationsData = await fetchAllWithPagination<CosmosDelegation>(chainId, url, "delegation_responses");
    } catch (error) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, error);
      continue;
    }

    if (!delegationsData) {
      continue;
    }

    return delegationsData.map((delegation) => {
      return {
        validatorAddresses: [delegation.delegation.validator_address],
        amount: BigInt(delegation.balance.amount),
        status: StakingStatus.LOCKED,
      };
    });
  }

  throw new ThirdPartyProviderError(`Error while fetching delegations for ${chainId}`);
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
  const baseURL = getProviderUrls(chainId, ProviderType.node);
  const urls = baseURL.map(
    (url) => `${url}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`
  );

  for (const url of urls) {
    let unbondingsData: CosmosUnbondingDelegation[] | undefined;
    try {
      unbondingsData = await fetchAllWithPagination<CosmosUnbondingDelegation>(
        chainId,
        url,
        "unbonding_responses"
      );
    } catch (error) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, error);
      continue;
    }

    if (!unbondingsData) {
      continue;
    }

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

  throw new ThirdPartyProviderError(`Error while fetching unbonding delegations for ${chainId}`);
}

async function fetchRewards(
  chainId: ChainId,
  address: string
): Promise<{ native: StakingReward[]; tokens: TokenStakingReward[] }> {
  const baseURL = getProviderUrls(chainId, ProviderType.node);
  const urls = baseURL.map((url) => `${url}/cosmos/distribution/v1beta1/delegators/${address}/rewards`);

  for (const url of urls) {
    let response: Response | undefined;
    try {
      // (Note: this endpoint is not paginated)
      response = await fetchWithHeaders(url);
    } catch (error) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, error);
      continue;
    }

    if (!response) {
      continue;
    }

    if (!response.ok) {
      console.warn(
        `/!\\ Error received from ${chainId} node endpoint ${url.toString()}:`,
        await response.text()
      );
      continue;
    }

    const data: CosmosRewards = await response.json();

    if (!data?.rewards) {
      console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint ${url}:`, data);
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

  throw new ThirdPartyProviderError(`Error while fetching rewards for ${chainId}`);
}

async function fetchValidators(
  chainId: ChainId,
  paginationToken?: string
): Promise<{ validators: CosmosValidator[]; nextPage: string | null }> {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;
  const chainIdForValidators = chainParams.isICS ? ChainId.COSMOSHUB : chainId;

  const baseURL = getProviderUrls(chainIdForValidators, ProviderType.node);
  const urls = baseURL.map((url) => new URL(`${url}/cosmos/staking/v1beta1/validators`));

  for (const url of urls) {
    let response: Response | undefined;
    try {
      const paginationData = paginationFromB64(paginationToken);

      if (paginationData) {
        if (typeof paginationData === "string") {
          url.searchParams.set("pagination.key", paginationData);
        } else {
          throw new InvalidPaginationTokenError("Provided pagination token is invalid");
        }
      }

      response = await fetchWithHeaders(url.toString());
    } catch (error) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, error);
      continue;
    }

    if (!response) {
      continue;
    }

    if (!response.ok) {
      console.warn(
        `/!\\ Error received from ${chainId} node endpoint ${url.toString()}:`,
        await response.text()
      );
      continue;
    }

    const data = await response.json();

    if (data?.message === "illegal base64 data at input byte 4") {
      console.warn(`/!\\ Provided pagination token is invalid:`, data);
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }

    if (!Array.isArray(data?.validators)) {
      console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint ${url.toString()}:`, data);
      continue;
    }

    return {
      validators: data.validators,
      nextPage: paginationToB64(data.pagination.next_key),
    };
  }

  throw new ThirdPartyProviderError(`Error while fetching ${chainId} validators from the node`);
}

async function fetchAccount(chainId: ChainId, address: string): Promise<CosmosAccount> {
  const chainParams = CHAINS[chainId].params as CosmosChainParams;

  const account: CosmosAccount = {
    accountNumber: 0n,
    sequence: 0n,
    pubKeyType: chainParams?.defaultPubKeyType || "",
    pubKey: "",
  };

  const baseURL = getProviderUrls(chainId, ProviderType.node);
  const urls = baseURL.map((url) => `${url}/cosmos/auth/v1beta1/accounts/${address}`);

  for (const url of urls) {
    let response: Response | undefined;
    try {
      response = await fetchWithHeaders(url);
    } catch (error) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, error);
      continue;
    }
    // prettier-ignore
    if (response.status === 404) {
    let data = undefined;

    try {
      data = await response.json();
    } catch (e) {
      console.warn(`/!\\ Error while parsing data returned from ${chainId} node endpoint ${url}:`, e);
      continue;
    }

    // Node answers 404 with "code 5" when address is valid but account has just never been used onchain yet
    // We translate this to a "not enough funds" error for the user
    if (data?.code === 5) {
      console.warn(`/!\\ Account ${address} not found on chain ${chainId}:`, data);
      throw new UserInputError(`Balance is too low`);
    }
  } else if (!response.ok) {
    console.warn(`/!\\ Error received from ${chainId} node endpoint ${url.toString()}:`, await response.text());
    throw new ThirdPartyProviderError(`Error while fetching ${chainId} account info from the node`);
  }

    const data = await response.json();

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
      console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint ${url}:`, data);
      continue;
    }

    return account;
  }

  throw new ThirdPartyProviderError(`Error while fetching ${chainId} account info from the node`);
}

// NOTE Unused at the moment, all IBC token infos are retrieved from src/app/config/tokens/cosmos.ts
/*
async function fetchIBCTokenTicker(chainId: ChainId, ibcTokenId: string): Promise<string> {
  const url = `${getNodeRootUrl(chainId)}/ibc/apps/transfer/v1/denom_traces/${ibcTokenId}`;

  const data = await fetchWithHeaders(url);
  if (!data?.denom_trace?.base_denom) {
    console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint ${url}:`, data);
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
    console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint ${url}:`, data);
    throw new ThirdPartyProviderError(`Error while fetching ${chainId} network ID from the node`);
  }

  return data.default_node_info.network;
}
*/

async function simulateTransaction(chainId: ChainId, payload: string): Promise<bigint> {
  const baseURL = getProviderUrls(chainId, ProviderType.node);
  const urls = baseURL.map((url) => `${url}/cosmos/tx/v1beta1/simulate`);

  for (const url of urls) {
    let response: Response | undefined;
    try {
      const options: RequestInit = {
        method: "POST",
        body: payload,
      };

      response = await fetchWithHeaders(url, options);
    } catch (error) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, error);
      continue;
    }

    if (!response) {
      continue;
    }

    if (response.status !== 200) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, await response.text());
      continue;
    }

    const data = await (async () => {
      try {
        return await response.json();
      } catch (error) {
        console.warn(`/!\\ Error while parsing response from ${chainId} node endpoint ${url}:`, error);
      }
    })();

    if (!data?.gas_info?.gas_used) {
      console.warn(`/!\\ Invalid data returned from ${chainId} node endpoint ${url}:`, data);
      // TODO Babylon-specific error handling
      if (data?.message.includes("the BTC staking tx is already used")) {
        throw new BabylonTransactionAlreadyUsedError();
      } else if (data?.message.includes("the proof of possession is not valid")) {
        throw new BabylonInvalidProofOfPossessionError();
      } else if (data?.message.includes("insufficient funds")) {
        throw new InvalidTransactionError(statusFromMessage(`Balance is too low`));
      } else {
        throw new ThirdPartyProviderError(`Error while getting gas estimate for ${chainId} transaction`);
      }
    }

    return BigInt(data.gas_info.gas_used);
  }

  throw new ThirdPartyProviderError(`Error while getting gas estimate for ${chainId} transaction`);
}

async function broadcastTransaction(chainId: ChainId, payload: string): Promise<string> {
  const baseURL = getProviderUrls(chainId, ProviderType.node);
  const urls = baseURL.map((url) => `${url}/cosmos/tx/v1beta1/txs`);

  for (const url of urls) {
    let response: Response | undefined;
    try {
      const options: RequestInit = {
        method: "POST",
        body: payload,
      };

      response = await fetchWithHeaders(url, options);
    } catch (error) {
      console.warn(`/!\\ Error received from ${chainId} node endpoint ${url}:`, error);
      continue;
    }

    if (!response) {
      continue;
    }

    if (!response.ok) {
      console.warn(
        `/!\\ Error received from ${chainId} node endpoint ${url.toString()}:`,
        await response.text()
      );
      continue;
    }

    const data = await response.json();

    // TODO We could return more detailed error messages using
    // error codes in https://github.com/cosmos/cosmos-sdk/blob/main/types/errors/errors.go
    if (data?.tx_response?.code || !data?.tx_response?.txhash) {
      const errorMessage = `Broadcast on ${chainId} node returned invalid data`;

      console.warn(`/!\\ ${errorMessage}: ${JSON.stringify(data)}`);
      continue;
    }

    return data.tx_response.txhash;
  }

  throw new ThirdPartyProviderError(`Error while broadcasting ${chainId} transaction`);
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
