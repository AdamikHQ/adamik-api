import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";
import {
  InvalidPaginationTokenError,
  ThirdPartyProviderError,
  UnsupportedTokenIDError,
  UserInputError,
} from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "../../common";
import {
  AlgoAccount,
  AlgoAccountAsset,
  AlgoAsset,
  AlgoAssetAmount,
  AlgoTransactionBroadcastResponse,
  AlgoTransactionParams,
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
    const searchParams = new URLSearchParams({
      limit: "20",
    });

    if (response && response["next-token"]) {
      searchParams.set("next", response["next-token"]);
    }

    const url = `${ROOT_URL}/accounts/${address}/assets?${searchParams}`;

    response = await fetch(url).then((response) => response.json());

    if (response.message) {
      console.warn(`/!\\ Failed to fetch tokens data for algorand account '${address}':`, response.message);
      throw new ThirdPartyProviderError(`Failed to fetch tokens data for algorand account '${address}'`);
    }

    response["asset-holdings"].forEach((asset: any) => {
      accountAssets.push({
        assetHolding: {
          assetId: asset["asset-holding"]["asset-id"].toString(),
          amount: asset["asset-holding"].amount,
        },
        assetParams: {
          assetId: asset["asset-holding"]["asset-id"].toString(),
          name: asset["asset-params"].name,
          unitName: asset["asset-params"]["unit-name"],
          decimals: asset["asset-params"].decimals,
        },
      });
    });
  } while (response["next-token"]);

  return accountAssets;
}

async function fetchAccountASA(
  address: string,
  paginationToken?: string
): Promise<{ accountAssets: AlgoAccountAsset[]; nextPage: string | null }> {
  const paginationData = paginationFromB64(paginationToken);
  if (paginationData && typeof paginationData !== "string") {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }

  const searchParams = new URLSearchParams({
    limit: "20",
  });
  paginationData && searchParams.set("next", paginationData);

  const url = `${ROOT_URL}/accounts/${address}/assets?${searchParams}`;

  const response = await fetch(url).then((response) => response.json());

  if (response.message) {
    console.warn(`/!\\ Failed to fetch tokens data for algorand account '${address}':`, response.message);
    throw new ThirdPartyProviderError(`Failed to fetch tokens data for algorand account '${address}'`);
  }

  const accountAssets: AlgoAccountAsset[] = response["asset-holdings"].map(
    (asset: any): AlgoAccountAsset => ({
      assetHolding: {
        assetId: asset["asset-holding"]["asset-id"].toString(),
        amount: asset["asset-holding"].amount,
      },
      assetParams: {
        assetId: asset["asset-holding"]["asset-id"].toString(),
        name: asset["asset-params"].name,
        unitName: asset["asset-params"]["unit-name"],
        decimals: asset["asset-params"].decimals,
      },
    })
  );

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

async function fetchTransactionParams(): Promise<AlgoTransactionParams> {
  const url = `${ROOT_URL}/transactions/params`;

  const response = await fetch(url).then((response) => response.json());

  return {
    fee: response["fee"],
    minFee: response["min-fee"],
    firstRound: response["first-round"] ?? 0,
    lastRound: response["last-round"],
    genesisID: response["genesis-id"],
    genesisHash: response["genesis-hash"],
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
