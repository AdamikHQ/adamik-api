import {
  AccountAddress,
  Aptos,
  AptosConfig,
  MoveFunctionId,
  PendingTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { getCoinData } from "~/app/families/aptos/backend/indexer";
import {
  AccountResponse,
  AptosStakeResponse,
  AptosStakingAmounts,
  GasPriceEstimate,
} from "~/app/families/aptos/backend/types";
import {
  AptosTransaction,
  AptosTransactionParams,
  TransactionPayload,
  ValidatorSetResponse,
} from "~/app/families/aptos/types";
import { ChainId, ProviderType, TokenAmount, TokenType, TransactionData } from "~/app/model/types_WIP";
import { TokenStore } from "~/app/tools/tokenStore";
import { getProviderUrls } from "../../common";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";

export function getClient(chainId: ChainId): Aptos {
  const nodeUrl = getProviderUrls(chainId, ProviderType.node)[0];
  const config = new AptosConfig({ fullnode: nodeUrl });
  return new Aptos(config);
}

async function nodeRequest<T>(
  chainId: ChainId,
  path: string,
  method: "GET" | "POST" = "GET",
  data?: unknown
): Promise<T> {
  const nodeUrl = getProviderUrls(chainId, ProviderType.node)[0];

  const url = [nodeUrl, path].join("");
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type":
        data instanceof Buffer ? "application/x.aptos.signed_transaction+bcs" : "application/json",
    },
    body: data ? (data instanceof Buffer ? data : JSON.stringify(data)) : undefined,
  });

  if (!response.ok) {
    const responseData = await response.text();
    console.warn(`/!\\ Failed to fetch from Aptos node '${url}':`, responseData);
    throw new ThirdPartyProviderError(`Error while fetching data from the Aptos node`);
  }

  return (await response.json()) as T;
}

async function viewFunction<T>(chainId: ChainId, data: unknown): Promise<T> {
  const [nodeUrl] = getProviderUrls(chainId, ProviderType.node);

  const response = await fetch(`${nodeUrl}/view`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const responseData = await response.text();
    console.warn(`/!\\ Failed to call Aptos view function node '${nodeUrl}':`, { data, responseData });
    throw new ThirdPartyProviderError(`Error while calling Aptos view function`);
  }

  return (await response.json()) as T;
}

export async function fetchAccount(chainId: ChainId, address: string) {
  return nodeRequest<AccountResponse>(chainId, `/accounts/${address}`);
}

export async function fetchStakingAmounts(
  chainId: ChainId,
  address: string,
  stakingPool: string
): Promise<AptosStakingAmounts> {
  const [locked, unlocked, pending] = await viewFunction<AptosStakeResponse>(chainId, {
    function: "0x1::delegation_pool::get_stake",
    type_arguments: [],
    arguments: [stakingPool, address],
  });
  return {
    locked,
    unlocked,
    pending,
  };
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
