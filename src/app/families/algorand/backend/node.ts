import { CHAINS } from "~/app/config/chains";
import { AlgoAccount, AlgoAsset, AlgoTransactionParams, AlgoTransactionBroadcastResponse } from "./types";

// TODO Caching !
// TODO Sanitize data from backend

const ROOT_URL = CHAINS.algorand.backends.nodeURL;

async function fetchAccount(address: string): Promise<AlgoAccount> {
  const url = `${ROOT_URL}/accounts/${address}`;

  const data = await fetch(url).then((response) => response.json());

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

  return data.txId;
}

export { fetchAccount, fetchTransactionParams, broadcast };
