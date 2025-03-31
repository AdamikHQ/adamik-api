import {
  getBabylonParamByBtcHeight,
  StakingParams,
  VersionedStakingParams,
} from "@babylonlabs-io/btc-staking-ts";
import { CHAINS } from "~/app/config/chains";
import { Provider, ProviderType } from "~/app/model/types_WIP";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { BABYLON_BITCOIN_CHAIN } from "../psbt";
import {
  BabylonFinalityProviderV1,
  babylonFinalityProviderV1Schema,
  babylonNetworkInfoV2Schema,
  BabylonUnbondingBroadcastPayloadV1,
} from "./babylon.types";
import { getLatestBlockHeight } from "./mempoolSpace";

// Spec: https://staking-api.testnet.babylonlabs.io/swagger/index.html

// TODO Change to babylon when going mainnet
const ROOT_URL = CHAINS["babylon-testnet"].providers.find(
  (p: Provider) => p.type === ProviderType.babylon
)?.url;

async function fetchStakingParams(): Promise<StakingParams> {
  const url = `${ROOT_URL}/network-info`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Error received from bitcoin babylon endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching data from the provider");
  }

  const { data, message } = await response.json();

  if (message) {
    console.warn(`/!\\ Error received from bitcoin babylon endpoint: ${url.toString()}:`, message);
    throw new ThirdPartyProviderError(`Error while fetching data from the provider`);
  }

  const globalParams = babylonNetworkInfoV2Schema.array().safeParse(data?.params?.bbn);

  if (!globalParams.success) {
    console.warn(
      `/!\\ Invalid data returned from bitcoin babylon endpoint: ${url.toString()}:`,
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

  const bitcoinLatestBlockHeight = await getLatestBlockHeight(BABYLON_BITCOIN_CHAIN);

  return getBabylonParamByBtcHeight(bitcoinLatestBlockHeight, parsedParams);
}

async function fetchFinalityProviders(
  paginationToken?: string
): Promise<{ validators: BabylonFinalityProviderV1[]; nextPage: string | null }> {
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
    console.warn(
      `/!\\ Error received from bitcoin babylon endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching data from the provider");
  }

  const result = await response.json();

  if (result?.message === "invalid pagination key format") {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }

  // TODO Use pagination
  const { data, pagination } = result;

  const finalityProviders = babylonFinalityProviderV1Schema.array().safeParse(data);

  if (!finalityProviders.success) {
    console.warn(
      `/!\\ Invalid data returned from bitcoin babylon endpoint: ${url.toString()}:`,
      finalityProviders.error
    );
    throw new ThirdPartyProviderError(`Error while fetching data from the provider`);
  }

  return {
    validators: finalityProviders.data,
    nextPage: paginationToB64(pagination.next_key),
  };
}

// TODO Test this
async function postUnbondingTransaction(payload: BabylonUnbondingBroadcastPayloadV1) {
  const url = `${ROOT_URL}/unbonding`;

  const response = await fetch(url, {
    method: "POST",
    // TODO Test this
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from bitcoin babylon endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error during transaction broadcast to the node");
  }

  // FIXME Does the endpoint return a hash or something?...
}

export { fetchFinalityProviders, fetchStakingParams };
