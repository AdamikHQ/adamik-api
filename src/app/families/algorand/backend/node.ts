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

  const data = await fetch(url).then((response) => response.json());

  const assetAmounts: AlgoAssetAmount[] = data.assets
    ? data.assets.map((asset: { "asset-id": number; amount: number }): AlgoAssetAmount => {
        return {
          assetId: asset["asset-id"].toString(),
          amount: BigInt(asset.amount),
        };
      })
    : [];

  return {
    round: data.round,
    address: data.address,
    balance: BigInt(data.amount),
    pendingRewards: BigInt(data["pending-rewards"]),
    assetAmounts,
  };
}

async function fetchASA(assetId: string): Promise<AlgoAsset | null> {
  const url = `${ROOT_URL}/assets/${assetId}`;

  const data = await fetch(url).then((response) => response.json());

  if (data.message) {
    console.warn(`/!\\ Failed to fetch algorand token with ID '${assetId}':`, data.message);
    return null;
  }

  return {
    assetId,
    name: data.params.name,
    unitName: data.params["unit-name"],
    decimals: data.params.decimals,
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
