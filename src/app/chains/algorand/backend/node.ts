import { ChainId } from "~/app/model/types_WIP";
import { NODES } from "~/app/config/constants";
import {
  AlgoAccount,
  AlgoAsset,
  AlgoTransactionParams,
  AlgoTransactionBroadcastResponse,
} from "./types";

// TODO Caching !

const ROOT_URL = NODES.get(ChainId.ALGORAND);

async function fetchAccount(address: string): Promise<AlgoAccount> {
  const url = `${ROOT_URL}/accounts/${address}`;
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json;charset=UTF-8",
    },
  };

  const data = await fetch(url, options).then((response) => response.json());

  const assets: AlgoAsset[] = data.assets
    ? // FIXME: what is the type of `a`?
      data.assets.map((a: any): AlgoAsset => {
        return {
          assetId: a["asset-id"].toString(),
          balance: BigInt(a.amount),
        };
      })
    : [];

  return {
    round: data.round,
    address: data.address,
    balance: BigInt(data.amount),
    pendingRewards: BigInt(data["pending-rewards"]),
    assets,
  };
}

async function fetchTransactionParams(): Promise<AlgoTransactionParams> {
  const url = `${ROOT_URL}/transactions/params`;
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json;charset=UTF-8",
    },
  };

  const data = await fetch(url, options).then((response) => response.json());

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

  const data: AlgoTransactionBroadcastResponse = await fetch(url, options).then(
    (response) => response.json()
  );

  return data.txId;
}

export { fetchAccount, fetchTransactionParams, broadcast };
