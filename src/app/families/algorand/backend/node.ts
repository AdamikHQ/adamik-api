import { SuggestedParams as AlgoSuggestedParams } from "algosdk";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";
import { paginationFromB64, paginationToB64 } from "~/app/tools/convertors/pagination";
import {
  InvalidPaginationTokenError,
  ThirdPartyProviderError,
  UnsupportedTokenIDError,
  UserInputError,
} from "~/app/tools/handlers/errors";
import {
  AlgoAccount,
  AlgoAccountAsset,
  AlgoAsset,
  AlgoAssetAmount,
  AlgoTransactionBroadcastResponse,
} from "./types";

// TODO Sanitize data from backend

const ROOT_URL = CHAINS.algorand.backends.nodeURL;

async function fetchAccount(address: string): Promise<AlgoAccount> {
  const url = `${ROOT_URL}/accounts/${address}`;

  const response = await fetch(url).then((response) => response.json());

  if (response.message) {
    console.warn(`/!\\ Failed to fetch data for algorand account '${address}':`, response.message);
    throw new ThirdPartyProviderError(`Failed to fetch data for algorand account '${address}'`);
  }

  const assetAmounts: AlgoAssetAmount[] = response.assets
    ? response.assets.map((asset: { "asset-id": number; amount: number }): AlgoAssetAmount => {
        return {
          assetId: asset["asset-id"].toString(),
          amount: asset.amount,
        };
      })
    : [];

  return {
    round: response.round,
    address: response.address,
    balance: response.amount,
    pendingRewards: response["pending-rewards"],
    assetAmounts,
  };
}

async function fetchAllAccountASA(address: string): Promise<AlgoAccountAsset[]> {
  const accountAssets: AlgoAccountAsset[] = [];

  let response;
  do {
    const searchParams = new URLSearchParams();
    if (response && response["next-token"]) {
      searchParams.set("next", response["next-token"]);
    }

    const url = `${ROOT_URL}/accounts/${address}/assets?${searchParams}`;

    response = await fetch(url).then((response) => response.json());

    if (response.message || !response["asset-holdings"]) {
      console.warn(`/!\\ Failed to fetch tokens data for algorand account '${address}':`, response.message);
      throw new ThirdPartyProviderError(`Failed to fetch tokens data for algorand account '${address}'`);
    }

    response["asset-holdings"].forEach((asset: any) => {
      // Rare, but data is sometimes missing... should not happen but it does
      if (asset["asset-holding"] && asset["asset-params"]) {
        accountAssets.push({
          assetHolding: {
            assetId: asset["asset-holding"]["asset-id"].toString(),
            amount: asset["asset-holding"].amount,
          },
          assetParams: {
            assetId: asset["asset-holding"]["asset-id"].toString(),
            name: asset["asset-params"].name || "",
            unitName: asset["asset-params"]["unit-name"] || "",
            decimals: asset["asset-params"].decimals,
          },
        });
      }
    });
  } while (response["next-token"]);

  return accountAssets;
}

async function fetchAccountASA(
  address: string,
  paginationToken?: string
): Promise<{ accountAssets: AlgoAccountAsset[]; nextPage: string | null }> {
  const paginationData = paginationFromB64(paginationToken);
  const searchParams = new URLSearchParams({
    limit: "20", // Smaller pages when pagination is requested
  });

  if (paginationData) {
    if (typeof paginationData === "string") {
      searchParams.set("next", paginationData);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const url = `${ROOT_URL}/accounts/${address}/assets?${searchParams}`;

  const response = await fetch(url).then((response) => response.json());

  if (response.message || !response["asset-holdings"]) {
    console.warn(`/!\\ Failed to fetch tokens data for algorand account '${address}':`, response.message);
    throw new ThirdPartyProviderError(`Failed to fetch tokens data for algorand account '${address}'`);
  }

  const accountAssets: AlgoAccountAsset[] = [];
  response["asset-holdings"].forEach((asset: any) => {
    // Rare, but data is sometimes missing... should not happen but it does
    if (asset["asset-holding"] && asset["asset-params"]) {
      accountAssets.push({
        assetHolding: {
          assetId: asset["asset-holding"]["asset-id"].toString(),
          amount: asset["asset-holding"].amount,
        },
        assetParams: {
          assetId: asset["asset-holding"]["asset-id"].toString(),
          name: asset["asset-params"].name || "",
          unitName: asset["asset-params"]["unit-name"] || "",
          decimals: asset["asset-params"].decimals,
        },
      });
    }
  });

  const nextPage = response["next-token"] ? paginationToB64(response["next-token"]) : null;

  return {
    accountAssets,
    nextPage,
  };
}

async function fetchASA(assetId: string): Promise<AlgoAsset> {
  const url = `${ROOT_URL}/assets/${assetId}`;

  const response = await fetch(url).then((response) => response.json());

  if (response.message) {
    console.warn(`/!\\ Failed to fetch algorand token with ID '${assetId}':`, response.message);
    throw new UnsupportedTokenIDError(assetId, ChainId.ALGORAND);
  }

  return {
    assetId,
    name: response.params.name,
    unitName: response.params["unit-name"],
    decimals: response.params.decimals,
  };
}

async function fetchTransactionParams(): Promise<AlgoSuggestedParams> {
  const url = `${ROOT_URL}/transactions/params`;

  const response = await fetch(url).then((response) => response.json());

  return {
    fee: response["fee"],
    minFee: response["min-fee"],
    firstValid: response["last-round"],
    // Bit of safety: set tx validity to the next 1000 blocks
    lastValid: response["last-round"] + 1000,
    genesisID: response["genesis-id"],
    genesisHash: new Uint8Array(Buffer.from(response["genesis-hash"], "base64")),
  };
}

async function broadcast(payload: Buffer): Promise<string> {
  const url = `${ROOT_URL}/transactions`;
  const options = {
    method: "POST",
    body: payload,
  };

  const response: AlgoTransactionBroadcastResponse = await fetch(url, options).then((response) =>
    response.json()
  );

  if (response.message) {
    throw new UserInputError(`Transaction broadcast failed: ${response.message}`);
  }

  return response.txId;
}

export { broadcast, fetchAccount, fetchAccountASA, fetchAllAccountASA, fetchASA, fetchTransactionParams };
