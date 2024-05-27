import { CHAINS } from "~/app/config/chains";
import {
  AlgoAccount,
  AlgoAsset,
  AlgoTransactionParams,
  AlgoTransactionBroadcastResponse,
  AlgoAssetAmount,
} from "./types";

// TODO Caching !
// TODO Sanitize data from backend

const ROOT_URL = CHAINS.algorand.backends.nodeURL;

async function fetchAccount(address: string): Promise<AlgoAccount> {
  const url = `${ROOT_URL}/accounts/${address}`;

  // NOTE: non-standard response format from the current algonode.cloud provider:
  // additional top-level "account" field, instead of flat account data in standard response
  const { account } = await fetch(url).then((response) => response.json());

  const assetAmounts: AlgoAssetAmount[] = account.assets
    ? account.assets.map((asset: { "asset-id": number; amount: number }): AlgoAssetAmount => {
        return {
          assetId: asset["asset-id"].toString(),
          amount: BigInt(asset.amount),
        };
      })
    : [];

  return {
    round: account.round,
    address: account.address,
    balance: BigInt(account.amount),
    pendingRewards: BigInt(account["pending-rewards"]),
    assetAmounts,
  };
}

async function fetchASA(assetId: string): Promise<AlgoAsset | null> {
  const url = `${ROOT_URL}/assets/${assetId}`;

  // NOTE: non-standard response format from the current algonode.cloud provider:
  // additional top-level "asset" field, instead of flat asset data in standard response
  const { asset, message } = await fetch(url).then((response) => response.json());

  if (message) {
    console.warn(`/!\\ Failed to fetch algorand token with ID '${assetId}':`, message);
    return null;
  }

  return {
    assetId,
    name: asset.params.name,
    unitName: asset.params["unit-name"],
    decimals: asset.params.decimals,
  };
}

async function fetchTransactionParams(): Promise<AlgoTransactionParams> {
  const url = `${ROOT_URL}/transactions/params`;

  const data = await fetch(url).then((response) => response.json());

  return {
    fee: data["fee"],
    minFee: data["min-fee"],
    firstRound: data["first-round"] ?? 0,
    lastRound: data["last-round"],
    genesisID: data["genesis-id"],
    genesisHash: data["genesis-hash"],
  };
}

async function broadcast(payload: Buffer): Promise<string> {
  const url = `${ROOT_URL}/transactions`;
  const options = {
    method: "POST",
    body: payload,
  };

  const data: AlgoTransactionBroadcastResponse = await fetch(url, options).then((response) =>
    response.json()
  );

  if (data.message) {
    throw new Error(data.message);
  }

  return data.txId;
}

export { fetchAccount, fetchASA, fetchTransactionParams, broadcast };
