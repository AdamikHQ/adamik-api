import { CHAINS } from "~/app/config/chains";
import { Provider, ProviderType } from "~/app/model/types_WIP";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import {
  BabylonFinalityProviderV1,
  babylonFinalityProviderV1Schema,
  BabylonNetworkInfoV2,
  babylonNetworkInfoV2Schema,
  BabylonUnbondingBroadcastPayloadV1,
} from "./babylon.types";

// Spec: https://staking-api.testnet.babylonlabs.io/swagger/index.html

// TODO Change to babylon when going mainnet
const ROOT_URL = CHAINS["babylon-testnet"].providers.find(
  (p: Provider) => p.type === ProviderType.babylon
)?.url;

async function fetchNetworkInfo(): Promise<BabylonNetworkInfoV2> {
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

  // Get the highest value among available versions
  // FIXME Should we instead get the one closest to current block height?...
  // https://github.com/babylonlabs-io/babylon/blob/c3bf51131c7c9febb83b3db310da2e1e67bd7dd5/docs/register-bitcoin-stake.md#32-babylon-chain-btc-staking-parameters
  const latestVersion = globalParams.data.reduce(
    (previous, current) => (current.version > previous.version ? current : previous),
    globalParams.data[0]
  );

  return latestVersion;
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

export { fetchFinalityProviders, fetchNetworkInfo };
