import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import {
  BabylonFinalityProviderV1,
  babylonFinalityProviderV1Schema,
  BabylonGlobalParamsV1,
  babylonGlobalParamsV1Schema,
  BabylonUnbondingBroadcastPayloadV1,
} from "./babylon.types";

// Spec: https://staking-api.testnet.babylonlabs.io/swagger/index.html
// FIXME Hardcoded here, should we put it in CHAINS config instead?
// TODO Implement v2 too, to be ready to switch
const ROOT_URL = "https://staking-api.babylonlabs.io/v1";
//const ROOT_URL = "https://staking-api.testnet.babylonlabs.io/v2";

// (Will be renamed "network info" instead of "global params" in v2)
async function fetchGlobalParams(): Promise<BabylonGlobalParamsV1> {
  const url = `${ROOT_URL}/global-params`;

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

  const globalParams = babylonGlobalParamsV1Schema.array().safeParse(data?.versions);

  if (!globalParams.success) {
    console.warn(
      `/!\\ Invalid data returned from bitcoin babylon endpoint: ${url.toString()}:`,
      globalParams.error
    );
    throw new ThirdPartyProviderError(`Error while fetching data from the provider`);
  }

  // FIXME Is it ok to arbitrarily take the 1st version? Should we take the last one instead?
  return globalParams.data[0];
}

async function fetchFinalityProviders(): Promise<BabylonFinalityProviderV1[]> {
  const url = `${ROOT_URL}/finality-providers`;

  const response = await fetch(url);

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
    console.warn(`/!\\ Invalid data returned from bitcoin babylon endpoint: ${url.toString()}:`, data);
    throw new ThirdPartyProviderError(`Error while fetching data from the provider`);
  }

  return finalityProviders.data;
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

export { fetchFinalityProviders, fetchGlobalParams };
