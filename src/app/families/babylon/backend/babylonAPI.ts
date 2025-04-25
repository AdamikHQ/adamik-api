import { VersionedStakingParams } from "@babylonlabs-io/btc-staking-ts";
import { CHAINS } from "~/app/config/chains";
import { AccountState, ChainId, Provider, ProviderType, StakingStatus } from "~/app/model/types_WIP";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import {
  computeCompletionDateForDelegation,
  getBabylonChainIds,
  getBabylonStakingParamsByVersion,
} from "../logic";
import {
  BabylonDelegationState,
  BabylonDelegationsV2,
  babylonDelegationsV2ResponseSchema,
  BabylonDelegationV2,
  babylonDelegationV2ResponseSchema,
  BabylonFinalityProviderStatus,
  BabylonFinalityProviderV2,
  babylonFinalityProviderV2Schema,
  babylonNetworkInfoV2Schema,
} from "./babylonAPI.types";

// Doc : https://docs.babylonlabs.io/api/staking-api/babylon-staking-api/

const getRootUrl = (chainId: ChainId) =>
  CHAINS[getBabylonChainIds(chainId).babylon].providers.find((p: Provider) => p.type === ProviderType.babylon)
    ?.url;

async function fetchAllBabylonStakingParams(chainId: ChainId): Promise<VersionedStakingParams[]> {
  const url = `${getRootUrl(chainId)}/network-info`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`/!\\ Error received from babylon API endpoint ${url.toString()}:`, await response.text());
    throw new ThirdPartyProviderError("Error while fetching data from the provider");
  }

  const { data, message } = await response.json();

  if (message) {
    console.warn(`/!\\ Error received from babylon API endpoint: ${url.toString()}:`, message);
    throw new ThirdPartyProviderError(`Error while fetching data from the provider`);
  }

  const globalParams = babylonNetworkInfoV2Schema.array().safeParse(data?.params?.bbn);

  if (!globalParams.success) {
    console.warn(
      `/!\\ Invalid data returned from babylon API endpoint: ${url.toString()}:`,
      globalParams.error
    );
    throw new ThirdPartyProviderError(`Error while fetching data from the provider`);
  }

  const parsedParams: VersionedStakingParams[] = globalParams.data.map((param) => ({
    version: param.version,
    btcActivationHeight: param.btc_activation_height,
    covenantNoCoordPks: param.covenant_pks,
    covenantQuorum: param.covenant_quorum,
    unbondingTime: param.unbonding_time_blocks,
    unbondingFeeSat: param.unbonding_fee_sat,
    maxStakingAmountSat: param.max_staking_value_sat,
    minStakingAmountSat: param.min_staking_value_sat,
    maxStakingTimeBlocks: param.max_staking_time_blocks,
    minStakingTimeBlocks: param.min_staking_time_blocks,
    slashing: {
      slashingPkScriptHex: param.slashing_pk_script,
      slashingRate: parseFloat(param.slashing_rate),
      minSlashingTxFeeSat: param.min_slashing_tx_fee_sat,
    },
  }));

  return parsedParams;
}

async function fetchBabylonFinalityProviders(
  chainId: ChainId,
  paginationToken?: string
): Promise<{ validators: BabylonFinalityProviderV2[]; nextPage: string | null }> {
  const url = new URL(`${getRootUrl(chainId)}/finality-providers`);

  const paginationData = paginationFromB64(paginationToken);

  if (paginationData) {
    if (typeof paginationData === "string") {
      url.searchParams.set("pagination.key", paginationData);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    console.warn(`/!\\ Error received from babylon API endpoint ${url.toString()}:`, await response.text());
    throw new ThirdPartyProviderError("Error while fetching data from the provider");
  }

  const result = await response.json();

  if (result?.message === "invalid pagination key format") {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }

  // TODO Use pagination
  const { data, pagination } = result;

  const finalityProviders = babylonFinalityProviderV2Schema.array().safeParse(data);

  if (!finalityProviders.success) {
    console.warn(
      `/!\\ Invalid data returned from babylon API endpoint: ${url.toString()}:`,
      finalityProviders.error
    );
    throw new ThirdPartyProviderError(`Error while fetching data from the provider`);
  }

  return {
    // Keep only active validators
    validators: finalityProviders.data.filter(
      (finalityProvider) =>
        finalityProvider.state === BabylonFinalityProviderStatus.FINALITY_PROVIDER_STATUS_ACTIVE
    ),
    nextPage: paginationToB64(pagination.next_key),
  };
}

async function fetchBabylonDelegation(
  chainId: ChainId,
  bitcoinTransactionId: string
): Promise<BabylonDelegationV2 | null> {
  const url = new URL(`${getRootUrl(chainId)}/delegation`);
  url.searchParams.set("staking_tx_hash_hex", bitcoinTransactionId);

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    } else {
      console.warn(`/!\\ Error received from babylon API endpoint ${url.toString()}:`, await response.text());
      throw new ThirdPartyProviderError("Error while fetching staking data from the provider");
    }
  }

  const result = await response.json();

  if (result?.message) {
    console.warn(`/!\\ Error received from babylon API endpoint: ${url.toString()}:`, result.message);
    throw new ThirdPartyProviderError("Error while fetching staking data from the provider");
  }

  const parsedResult = babylonDelegationV2ResponseSchema.safeParse(result);

  if (!parsedResult.success) {
    console.warn(
      `/!\\ Invalid data returned from babylon API endpoint: ${url.toString()}:`,
      parsedResult.error
    );
    throw new ThirdPartyProviderError("Error while fetching staking data from the provider");
  }

  return parsedResult.data;
}

async function fetchBabylonDelegations(
  chainId: ChainId,
  bitcoinPubKeyHex: string,
  paginationToken?: string
): Promise<{
  delegations: BabylonDelegationsV2;
  nextPage: string | null;
}> {
  const url = new URL(`${getRootUrl(chainId)}/delegations`);

  // Add required staker_pk_hex parameter
  url.searchParams.set("staker_pk_hex", bitcoinPubKeyHex);

  const paginationData = paginationFromB64(paginationToken);

  if (paginationData) {
    if (typeof paginationData === "string") {
      url.searchParams.set("pagination.key", paginationData);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 404) {
      return {
        delegations: { data: [] },
        nextPage: null,
      };
    } else {
      console.warn(`/!\\ Error received from babylon API endpoint ${url.toString()}:`, await response.text());
      throw new ThirdPartyProviderError("Error while fetching delegations data from the provider");
    }
  }

  const result = await response.json();

  if (result?.message) {
    if (result.message === "invalid pagination key format") {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
    console.warn(`/!\\ Error received from babylon API endpoint: ${url.toString()}:`, result.message);
    throw new ThirdPartyProviderError("Error while fetching delegations data from the provider");
  }

  const parsedResult = babylonDelegationsV2ResponseSchema.safeParse(result);

  if (!parsedResult.success) {
    console.warn(
      `/!\\ Invalid data returned from babylon API endpoint: ${url.toString()}:`,
      parsedResult.error
    );
    throw new ThirdPartyProviderError("Error while fetching delegations data from the provider");
  }

  return {
    delegations: parsedResult.data,
    nextPage: paginationToB64(parsedResult.data.pagination.next_key || null),
  };
}

async function fetchBabylonStakingData(chainId: ChainId, bitcoinPubKeyHex: string): Promise<AccountState> {
  const stakingState: AccountState["balances"]["staking"] = {
    total: 0n,
    locked: 0n,
    unlocking: 0n,
    unlocked: 0n,
    positions: [],
  };

  // substring because staker pubkey is expected without the coordinate bytes
  const bitcoinPubKeyNoCoordHex = bitcoinPubKeyHex.substring(2);
  const { delegations } = await fetchBabylonDelegations(chainId, bitcoinPubKeyNoCoordHex);

  // Process each delegation to categorize them depending on their state
  for (const delegation of delegations.data) {
    const completionDate = await computeCompletionDateForDelegation(chainId, delegation);

    let amount: bigint;
    let status: StakingStatus;
    switch (delegation.state) {
      // These are actively staked
      case BabylonDelegationState.PENDING:
      case BabylonDelegationState.VERIFIED:
      case BabylonDelegationState.ACTIVE:
        {
          status =
            delegation.state === BabylonDelegationState.ACTIVE ? StakingStatus.LOCKED : StakingStatus.PENDING;

          amount = BigInt(delegation.delegation_staking.staking_amount);
          stakingState.locked += amount;
        }
        break;

      // These are in the process of being unstaked
      case BabylonDelegationState.TIMELOCK_UNBONDING:
      case BabylonDelegationState.EARLY_UNBONDING:
        {
          status = StakingStatus.UNLOCKING;

          amount = BigInt(delegation.delegation_staking.staking_amount);
          stakingState.unlocking += amount;
        }
        break;

      // These have completed unstaking and are ready to be withdrawn
      case BabylonDelegationState.TIMELOCK_WITHDRAWABLE:
      case BabylonDelegationState.EARLY_UNBONDING_WITHDRAWABLE:
      case BabylonDelegationState.TIMELOCK_SLASHING_WITHDRAWABLE:
      case BabylonDelegationState.EARLY_UNBONDING_SLASHING_WITHDRAWABLE:
        {
          status = StakingStatus.UNLOCKED;

          amount = BigInt(delegation.delegation_staking.staking_amount);
          stakingState.unlocked += amount;
        }
        break;

      // These have been slashed and are not part of staking anymore
      case BabylonDelegationState.SLASHED:
        {
          status = StakingStatus.SLASHED;

          const babylonParams = await getBabylonStakingParamsByVersion(chainId, delegation.params_version);

          amount = BigInt(
            delegation.delegation_staking.staking_amount * (1 - (babylonParams?.slashing?.slashingRate ?? 0))
          );
          stakingState.unlocked += amount;
        }
        break;

      default:
        console.warn(`/!\\ Unsupported babylon delegation state: ${delegation.state}`);
      case BabylonDelegationState.TIMELOCK_WITHDRAWN:
      case BabylonDelegationState.EARLY_UNBONDING_WITHDRAWN:
      case BabylonDelegationState.TIMELOCK_SLASHING_WITHDRAWN:
      case BabylonDelegationState.EARLY_UNBONDING_SLASHING_WITHDRAWN:
        continue; // Skip adding this to positions
    }

    // Create a staking position for this delegation
    stakingState.positions.push({
      stakeId: delegation.delegation_staking.staking_tx_hash_hex, // Use transaction hash as stake ID
      validatorAddresses: delegation.finality_provider_btc_pks_hex, // Use finality provider BTC public keys
      amount,
      status,
      completionDate,
    });
  }

  // Calculate the total staking amount
  stakingState.total = stakingState.locked + stakingState.unlocking + stakingState.unlocked;

  return {
    balances: {
      staking: stakingState,
    },
  };
}

export {
  fetchAllBabylonStakingParams,
  fetchBabylonDelegation,
  fetchBabylonDelegations,
  fetchBabylonFinalityProviders,
  fetchBabylonStakingData,
};
