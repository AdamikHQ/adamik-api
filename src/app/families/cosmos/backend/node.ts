import { COSMOS_NODE_URL } from "../constants";
import { CosmosAccount } from "./types";

// TODO Caching !
// TODO Sanitize data from backend

async function fetchBalance(address: string): Promise<bigint> {
  const url = `${COSMOS_NODE_URL}/cosmos/bank/v1beta1/balances/${address}`;

  const data = await fetch(url).then((response) => response.json());

  return data.balances.reduce(
    (sum: bigint, item: { denom: string; amount: string }) =>
      // TODO Proper CAL, to support more than ATOM
      item.denom === "uatom" ? sum + BigInt(item.amount) : sum,
    0n
  );
}

async function fetchAccount(address: string): Promise<CosmosAccount> {
  const accountData = {
    accountNumber: 0n,
    sequence: 0n,
    pubKeyType: "/cosmos.crypto.secp256k1.PubKey", // TODO CAL + proper family (different value for Injective)
    pubKey: "",
  };

  const url = `${COSMOS_NODE_URL}/cosmos/auth/v1beta1/accounts/${address}`;

  try {
    const data = await fetch(url).then((response) => response.json());

    // We use base_account for Ethermint chains and account for the rest
    const srcAccount = data.account.base_account || data.account;

    if (srcAccount.account_number) {
      accountData.accountNumber = BigInt(srcAccount.account_number);
    }

    if (srcAccount.sequence) {
      accountData.sequence = BigInt(srcAccount.sequence);
    }

    if (srcAccount.pub_key) {
      accountData.pubKey = srcAccount.pub_key.key;
      accountData.pubKeyType = srcAccount.pub_key["@type"];
    }
  } catch (e) {
    console.warn(
      "Could not fetch account info, account might have never been used, using default values instead"
    );
  }

  return accountData;
}

async function fetchChainId(): Promise<string> {
  const url = `${COSMOS_NODE_URL}/cosmos/base/tendermint/v1beta1/node_info`;
  const data = await fetch(url).then((response) => response.json());

  return data.default_node_info.network;
}

async function simulateTransaction(payload: string): Promise<bigint> {
  const url = `${COSMOS_NODE_URL}/cosmos/tx/v1beta1/simulate`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  const data = await fetch(url, options).then((response) => response.json());

  if (data?.gas_info?.gas_used) {
    return BigInt(data.gas_info.gas_used);
  } else {
    throw new Error("No gas_used returned from the node");
  }
}

async function broadcastTransaction(payload: string): Promise<string> {
  const url = `${COSMOS_NODE_URL}/cosmos/tx/v1beta1/txs`;
  const options: RequestInit = {
    method: "POST",
    body: payload,
  };

  const data = await fetch(url, options).then((response) => response.json());

  if (data?.tx_response?.code) {
    // error codes: https://github.com/cosmos/cosmos-sdk/blob/master/types/errors/errors.go
    throw new Error(
      "invalid broadcast return (code: " +
        (data?.tx_response?.code || "?") +
        ", message: '" +
        (data?.tx_response?.raw_log || "") +
        "')"
    );
  }

  return data.tx_response.txhash;
}

export { fetchBalance, fetchAccount, fetchChainId, simulateTransaction, broadcastTransaction };
