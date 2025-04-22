import { VersionedStakingParams } from "@babylonlabs-io/btc-staking-ts";
import { Transaction as BitcoinTransaction } from "bitcoinjs-lib";
import { CHAINS } from "~/app/config/chains";
import { fetchTransaction as fetchTransactionFromBlockchair } from "~/app/families/bitcoin/backend/blockchair";
import { fetchTransaction as fetchTransactionFromMS } from "~/app/families/bitcoin/backend/mempoolSpace";
import { AccountState, ChainId, Provider, ProviderType, StakingStatus } from "~/app/model/types_WIP";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { getTransactionfromProviders } from "../../common";
import { CURRENT_BABYLON_BITCOIN_CHAIN, CURRENT_BABYLON_COSMOS_CHAIN } from "../types";
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

// TODO Use getRootUrl instead to support both bitcoin chains
const ROOT_URL = CHAINS[CURRENT_BABYLON_COSMOS_CHAIN].providers.find(
  (p: Provider) => p.type === ProviderType.babylon
)?.url;

const getRootUrl = (chainId: ChainId) =>
  CHAINS[chainId === ChainId.BITCOIN_SIGNET ? ChainId.BABYLON_TESTNET : ChainId.BABYLON].providers.find(
    (p: Provider) => p.type === ProviderType.babylon
  )?.url;

// Average Bitcoin block time is around 10 minutes
const AVERAGE_BITCOIN_BLOCK_TIME_MS = 10 * 60 * 1000;

async function fetchAllBabylonStakingParams(): Promise<VersionedStakingParams[]> {
  const url = `${ROOT_URL}/network-info`;

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
  paginationToken?: string
): Promise<{ validators: BabylonFinalityProviderV2[]; nextPage: string | null }> {
  const url = new URL(`${ROOT_URL}/finality-providers`);

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

async function fetchBabylonDelegation(bitcoinTransactionId: string): Promise<BabylonDelegationV2 | null> {
  const url = new URL(`${ROOT_URL}/delegation`);
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
  bitcoinPubKeyHex: string,
  paginationToken?: string
): Promise<{
  delegations: BabylonDelegationsV2;
  nextPage: string | null;
}> {
  const url = new URL(`${ROOT_URL}/delegations`);

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

async function fetchBabylonStakingData(bitcoinPubKeyHex: string): Promise<AccountState> {
  const stakingState: AccountState["balances"]["staking"] = {
    total: 0n,
    locked: 0n,
    unlocking: 0n,
    unlocked: 0n,
    positions: [],
  };

  // substring because staker pubkey is expected without the coordinate bytes
  const bitcoinPubKeyNoCoordHex = bitcoinPubKeyHex.substring(2);
  const { delegations } = await fetchBabylonDelegations(bitcoinPubKeyNoCoordHex);

  // Process each delegation to categorize them as locked, unlocking, or unlocked
  for (const delegation of delegations.data) {
    const stakingAmount = BigInt(delegation.delegation_staking.staking_amount);

    let stakingStatus: StakingStatus;
    let completionDate: number | undefined;

    // FIXME Doesn't take into account:
    // - supported providers by chain
    // - supported functions by provider
    const fetchTransactionFunctions = [fetchTransactionFromMS, fetchTransactionFromBlockchair];

    const bitcoinStakingTransaction = await getTransactionfromProviders(
      CURRENT_BABYLON_BITCOIN_CHAIN,
      delegation.delegation_staking.staking_tx_hash_hex,
      fetchTransactionFunctions
    );

    if (bitcoinStakingTransaction?.parsed?.timestamp) {
      const stakingStartingTime = bitcoinStakingTransaction.parsed.timestamp;
      const stakingDuration =
        // (staking_timelock is a number of blocks)
        delegation.delegation_staking.staking_timelock * AVERAGE_BITCOIN_BLOCK_TIME_MS;
      completionDate = stakingStartingTime + stakingDuration;
    }

    // Categorize the delegation based on its state
    switch (delegation.state) {
      case BabylonDelegationState.PENDING:
      case BabylonDelegationState.VERIFIED:
      case BabylonDelegationState.ACTIVE:
        // These are actively staked (locked) amounts
        stakingState.locked += stakingAmount;
        stakingStatus =
          delegation.state === BabylonDelegationState.ACTIVE ? StakingStatus.LOCKED : StakingStatus.PENDING;
        break;

      case BabylonDelegationState.TIMELOCK_UNBONDING:
      case BabylonDelegationState.EARLY_UNBONDING:
        // These are in the process of being unstaked (unlocking)
        stakingState.unlocking += stakingAmount;
        stakingStatus = StakingStatus.UNLOCKING;

        // In the specific case of early unbonding,
        // i.e if an unbonding transaction is found,
        // then replace the initial completion date with the anticipated one

        const bitcoinUnbondingTransactionId = BitcoinTransaction.fromHex(
          delegation.delegation_unbonding.unbonding_tx
        ).getId();

        const bitcoinUnbondingTransaction = await getTransactionfromProviders(
          CURRENT_BABYLON_BITCOIN_CHAIN,
          bitcoinUnbondingTransactionId,
          fetchTransactionFunctions
        );

        if (bitcoinUnbondingTransaction?.parsed?.timestamp) {
          const unbondingStartingTime = bitcoinUnbondingTransaction.parsed.timestamp;
          const unbondingDuration =
            // (unbonding_timelock is a number of blocks)
            delegation.delegation_unbonding.unbonding_timelock * AVERAGE_BITCOIN_BLOCK_TIME_MS;
          completionDate = unbondingStartingTime + unbondingDuration;
        }
        break;

      case BabylonDelegationState.TIMELOCK_WITHDRAWABLE:
      case BabylonDelegationState.EARLY_UNBONDING_WITHDRAWABLE:
      case BabylonDelegationState.TIMELOCK_SLASHING_WITHDRAWABLE:
      case BabylonDelegationState.EARLY_UNBONDING_SLASHING_WITHDRAWABLE:
        // These have completed unstaking and are ready to be withdrawn (unlocked)
        stakingState.unlocked += stakingAmount;
        stakingStatus = StakingStatus.UNLOCKED;
        break;

      // We don't count withdrawn amounts as they're not part of staking anymore
      default:
        // No action needed for other states
        continue; // Skip adding this to positions
    }

    // Create a staking position for this delegation
    stakingState.positions.push({
      stakeId: delegation.delegation_staking.staking_tx_hash_hex, // Use transaction hash as stake ID
      validatorAddresses: delegation.finality_provider_btc_pks_hex, // Use finality provider BTC public keys
      amount: stakingAmount,
      status: stakingStatus,
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
