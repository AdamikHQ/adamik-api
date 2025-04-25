import {
  AptosResource,
  ValidatorSetResponse,
  AccountCoinResource,
  AptosTransaction,
  TransactionPayload,
  AptosTransactionParams,
} from "~/app/families/aptos/types";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  Provider,
  ProviderType,
  TokenAmount,
  TokenType,
  TransactionData,
} from "~/app/model/types_WIP";
import { TokenStore } from "~/app/tools/tokenStore";
import { getCoinData } from "~/app/families/aptos/backend/indexer";
import {
  Aptos,
  AptosConfig,
  AccountAddress,
  MoveFunctionId,
  PendingTransactionResponse,
  UserTransactionResponse,
  InputEntryFunctionData,
} from "@aptos-labs/ts-sdk";
import { AccountResponse, CoinBalance, GasPriceEstimate } from "~/app/families/aptos/backend/types";

export function getClient(chainId: ChainId): Aptos {
  const nodeUrl = String(CHAINS[chainId].providers.find((p: Provider) => p.type === ProviderType.node)?.url);
  const config = new AptosConfig({ fullnode: nodeUrl });
  return new Aptos(config);
}

async function nodeRequest<T>(
  chainId: ChainId,
  path: string,
  method: "GET" | "POST" = "GET",
  data?: unknown
): Promise<T> {
  const nodeUrl = String(CHAINS[chainId].providers.find((p: Provider) => p.type === ProviderType.node)?.url);

  const response = await fetch(`${nodeUrl}${path}`, {
    method,
    headers: {
      "Content-Type":
        data instanceof Buffer ? "application/x.aptos.signed_transaction+bcs" : "application/json",
    },
    body: data ? (data instanceof Buffer ? data : JSON.stringify(data)) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchAccount(chainId: ChainId, address: string) {
  return nodeRequest<AccountResponse>(chainId, `/accounts/${address}`);
}

export async function fetchAccountResources(chainId: ChainId, address: string) {
  return nodeRequest(chainId, `/accounts/${address}/resources`);
}

export async function fetchAccountModules(chainId: ChainId, address: string) {
  return nodeRequest(chainId, `/accounts/${address}/modules`);
}

export async function submitTransaction(chainId: ChainId, tx: TransactionPayload) {
  return nodeRequest(chainId, "/transactions", "POST", tx);
}

export async function simulateTransaction(chainId: ChainId, tx: TransactionData) {
  const aptosTx: TransactionPayload = {
    sender: tx.senderAddress,
    sequence_number: await fetchSequenceNumber(chainId, tx.senderAddress),
    max_gas_amount: "2000",
    gas_unit_price: (await fetchGasPrice(chainId)).toString(),
    expiration_timestamp_secs: (Date.now() / 1000 + 360).toString(),
    payload: (tx.params as AptosTransactionParams)?.payload ?? {
      function: "0x1::aptos_account::transfer" as MoveFunctionId,
      arguments: [tx.recipientAddress, "1"],
    },
  };
  const aptos = getClient(chainId);

  const senderAddress = AccountAddress.fromString(tx.senderAddress);

  const aptosTransactionData = {
    sender: senderAddress,
    data: {
      function: aptosTx.payload.function,
      functionArguments: aptosTx.payload.arguments.map((arg) => String(arg)),
      typeArguments: aptosTx.payload.type_arguments,
    },
  };
  const transaction = await aptos.transaction.build.simple(aptosTransactionData);
  const [simulationResult] = await aptos.transaction.simulate.simple({
    transaction,
  });
  return simulationResult;
}

export async function fetchGasPrice(chainId: ChainId): Promise<bigint> {
  const estimate = await nodeRequest<GasPriceEstimate>(chainId, "/estimate_gas_price");
  return BigInt(estimate.gas_estimate);
}

export async function fetchSequenceNumber(chainId: ChainId, accountAddress: string): Promise<string> {
  try {
    const account = await fetchAccount(chainId, accountAddress);
    return account.sequence_number;
  } catch {
    return "0";
  }
}

export function fetchTransaction(chainId: ChainId, hash: string) {
  return nodeRequest(chainId, `/transactions/by_hash/${hash}`);
}

export async function fetchNativeBalance(chainId: ChainId, address: string) {
  const balance = await nodeRequest<CoinBalance>(
    chainId,
    `/accounts/${address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
  );
  return BigInt(balance.data.coin.value);
}

export async function fetchCoinBalance(chainId: ChainId, address: string, coinId: string) {
  try {
    const balance = await nodeRequest<CoinBalance>(
      chainId,
      `/accounts/${address}/resource/0x1::coin::CoinStore<${coinId}>`
    );
    return BigInt(balance.data.coin.value);
  } catch {
    return 0n;
  }
}

export async function fetchAccountCoins(chainId: ChainId, address: string): Promise<AccountCoinResource> {
  try {
    const resources = await nodeRequest<AptosResource[]>(chainId, `/accounts/${address}/resources`);
    return resources.filter((res) => res.type.startsWith("0x1::coin::CoinStore<")) as AccountCoinResource;
  } catch (e: unknown) {
    return [] as AccountCoinResource;
  }
}

export async function fetchValidators(chainId: ChainId): Promise<ValidatorSetResponse> {
  return nodeRequest<ValidatorSetResponse>(chainId, "/accounts/0x1/resource/0x1::stake::ValidatorSet");
}

export async function fetchTransactionByHash(
  chainId: ChainId,
  txId: string
): Promise<AptosTransaction | null> {
  try {
    return await nodeRequest<AptosTransaction>(chainId, `/transactions/by_hash/${txId}`);
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
  return Promise.all(
    coins.map(async (coin, index) => {
      if (coinData[index] === null) {
        coinData[index] = await getCoinData(chainId, coin.id);
        await TokenStore.save(chainId, [coinData[index]]);
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

export function getAccountTransactions(chainId: ChainId, address: string): Promise<AptosTransaction[]> {
  return nodeRequest<AptosTransaction[]>(chainId, `/accounts/${address}/transactions`);
}

export async function broadcast(chainId: ChainId, signedTransaction: string): Promise<string> {
  const bcsBytes = Buffer.from(signedTransaction, "hex");
  const resp = await nodeRequest<PendingTransactionResponse>(
    chainId,
    "/transactions",
    "POST",
    Buffer.from(bcsBytes)
  );
  return resp.hash;
}
