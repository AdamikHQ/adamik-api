import {
  AptosResource,
  ValidatorSetResponse,
  AccountCoinResource,
  AptosTransaction,
} from "~/app/families/aptos/types";

import { CHAINS } from "~/app/config/chains";
import { ChainId, Provider, ProviderType, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { TokenStore } from "~/app/tools/tokenStore";
import { getCoinData } from "~/app/families/aptos/backend/indexer";

const nodeUrl = String(CHAINS.aptos.providers.find((p: Provider) => p.type === ProviderType.node)?.url);

async function nodeRequest<T>(path: string, method: "GET" | "POST" = "GET", data?: unknown): Promise<T> {
  const response = await fetch(`${nodeUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getAccount(address: string) {
  return nodeRequest(`/accounts/${address}`);
}

export async function getAccountResources(address: string) {
  return nodeRequest(`/accounts/${address}/resources`);
}

export async function getAccountModules(address: string) {
  return nodeRequest(`/accounts/${address}/modules`);
}

export async function submitTransaction(txnPayload: any) {
  return nodeRequest("/transactions", "POST", txnPayload);
}

export async function getTransaction(hash: string) {
  return nodeRequest(`/transactions/by_hash/${hash}`);
}

export async function getAccountCoinsData(address: string): Promise<AccountCoinResource> {
  const resources = await nodeRequest<AptosResource[]>(`/accounts/${address}/resources`);
  return resources.filter((res) => res.type.startsWith("0x1::coin::CoinStore<")) as AccountCoinResource;
}

export async function getValidators(): Promise<ValidatorSetResponse> {
  return nodeRequest<ValidatorSetResponse>("/accounts/0x1/resource/0x1::stake::ValidatorSet");
}

export async function getTransactionByHash(txId: string): Promise<AptosTransaction | null> {
  try {
    return await nodeRequest(`/transactions/by_hash/${txId}`);
  } catch {
    return null;
  }
}

export async function populateCoinData(
  chainId: ChainId,
  coins: { id: string; amount: bigint }[]
): Promise<TokenAmount[]> {
  const coinData = await TokenStore.load(
    chainId,
    coins.map((coin) => coin.id)
  );
  return await Promise.all(
    coins.map(async (coin, index) => {
      if (coinData[index] === null) {
        coinData[index] = await getCoinData(chainId, coin.id);
      }
      return {
        token: {
          type: TokenType.APTOS_COIN,
          id: coin.id,
          name: coinData[index]!.name,
          ticker: coinData[index]!.ticker,
          decimals: coinData[index]!.decimals,
        },
        amount: coin.amount,
      };
    })
  );
}

export async function getAccountTransactions(address: string): Promise<AptosTransaction[]> {
  return nodeRequest<AptosTransaction[]>(`/accounts/${address}/transactions`);
}
