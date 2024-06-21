import { CHAINS } from "~/app/config/chains";
import { CosmosAccount, CosmosBalance, CosmosValidatorResponse } from "./types";
import { ChainId } from "~/app/model/types_WIP";
import { CosmosParams } from "../types";

// TODO Caching !
// TODO Sanitize data from backend

const getRootUrl = (chainId: ChainId) => CHAINS[chainId].backends.nodeURL;

async function fetchBalances(chainId: ChainId, address: string): Promise<CosmosBalance[]> {
  const url = `${getRootUrl(chainId)}/cosmos/bank/v1beta1/balances/${address}`;

  // TODO This request is paginated, need to handle pagination
  const data = await fetch(url).then((response) => response.json());
  if (!data?.balances) {
    return [];
  }

  return data.balances.map((item: any) => {
    return {
      denom: item.denom,
      amount: BigInt(item.amount),
    };
  });
}

async function fetchValidators(
  chainId: ChainId,
  offset: number,
  limit: number
): Promise<CosmosValidatorResponse> {
  const url = new URL(`${getRootUrl(chainId)}/cosmos/staking/v1beta1/validators`);
  url.searchParams.set("pagination.offset", offset.toString());
  url.searchParams.set("pagination.limit", limit.toString());

  const data: CosmosValidatorResponse = await fetch(url.toString()).then((response) => response.json());

  return data;
}

async function fetchAccount(chainId: ChainId, address: string): Promise<CosmosAccount> {
  const chainParams = CHAINS[chainId].params as CosmosParams;

  const accountData: CosmosAccount = {
    accountNumber: 0n,
    sequence: 0n,
    pubKeyType: chainParams?.defaultPubKeyType || "",
    pubKey: "",
  };

  const url = `${getRootUrl(chainId)}/cosmos/auth/v1beta1/accounts/${address}`;

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

async function fetchIBCTokenTicker(chainId: ChainId, ibcTokenId: string): Promise<string> {
  const url = `${getRootUrl(chainId)}/ibc/apps/transfer/v1/denom_traces/${ibcTokenId}`;

  const data = await fetch(url).then((response) => response.json());

  return data?.denom_trace?.base_denom || "";
}

async function fetchNetworkId(chainId: ChainId): Promise<string> {
  const url = `${getRootUrl(chainId)}/cosmos/base/tendermint/v1beta1/node_info`;
  const data = await fetch(url).then((response) => response.json());

  return data.default_node_info.network;
}

async function simulateTransaction(chainId: ChainId, payload: string): Promise<bigint> {
  const url = `${getRootUrl(chainId)}/cosmos/tx/v1beta1/simulate`;
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

async function broadcastTransaction(chainId: ChainId, payload: string): Promise<string> {
  const url = `${getRootUrl(chainId)}/cosmos/tx/v1beta1/txs`;
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

export {
  fetchBalances,
  fetchAccount,
  fetchIBCTokenTicker,
  fetchNetworkId,
  simulateTransaction,
  broadcastTransaction,
  fetchValidators,
};
