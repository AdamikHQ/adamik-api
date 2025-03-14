import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { Provider, ChainId, ProviderType } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { Xpub } from "../types";
import {
  BlockchairAddressesResponse,
  BlockchairRawTransactionData,
  BlockchairRawTransactionResponse,
  BlockchairResponseContext,
  BlockchairStatsData,
  BlockchairTransactionBroadcastStatus,
  BlockchairTransactionData,
  BlockchairTransactionsResponse,
  BlockchairXpubData,
  BlockchairXpubResponse,
} from "./types";

// TODO Need proper mapping between Adamik ChainID <> Blockchair ChainID (to support more than bitcoin)

/**
 * Fetches xpub data from Blockchair API:
 * NOTE ON ADDRESS SCANNING:
 * - The API automatically determines scanning depth following BIP32 standard
 * - Addresses are processed in groups of 20
 * - Scanning continues until finding a gap limit of unused addresses
 * - No manual depth parameter possible - the API handles this automatically
 * - Default limit is 100 addresses (can be changed with ?limit parameter up to 10000)
 * - Premium API users get increased limit of up to 20,000 addresses (10,000 main + 10,000 change)
 */
async function fetchXpubDashboard(
  chainId: ChainId,
  xpub: Xpub
): Promise<{ data: BlockchairXpubData; context: BlockchairResponseContext }> {
  const explorerURL = CHAINS[chainId].backends.find((p: Provider) => p.type === ProviderType.blockchair)?.url;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const url = `${explorerURL}/dashboards/xpub/${xpub}?${queryParams.toString()}`;
  const response = await fetch(url);

  if (response.status >= 500) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching Xpub data from the explorer");
  }

  const parsedResponse = BlockchairXpubResponse.safeParse(await response.json());

  if (!parsedResponse.success) {
    console.warn(
      `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.error
    );
    throw new ThirdPartyProviderError("Error while parsing addresses data from the explorer");
  }

  const context = parsedResponse.data.context;
  const data = parsedResponse.data.data[xpub];

  if (!data || context.code != 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.data
    );
    throw new ThirdPartyProviderError("Error in Xpub data received from the explorer");
  }

  if (!context.state) {
    console.warn(`Missing current block height for chain ID ${chainId} in: ${JSON.stringify(context)}`);
    throw new ThirdPartyProviderError(`Missing current block height in data returned from explorer`);
  }

  // Custom data formatting: we need script_hex for each UTXO, so we add it manually
  data.utxo.forEach((utxo) => {
    const utxoAddress = Object.keys(data.addresses).find((address) => address === utxo.address);
    if (!utxoAddress) {
      console.warn(
        `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
        parsedResponse.data
      );
      throw new ThirdPartyProviderError("Error in addresses data received from the explorer");
    }

    utxo.script_hex = data.addresses[utxoAddress].script_hex;
  });

  return {
    data: parsedResponse.data.data[xpub],
    context: parsedResponse.data.context,
  };
}

async function fetchAddressesBatch(
  chainId: ChainId,
  addressesBatch: string[]
): Promise<BlockchairAddressesResponse | null> {
  const explorerURL = CHAINS[chainId].backends.find((p: Provider) => p.type === ProviderType.blockchair)?.url;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  // TODO If/when Blockchair supports it, switch to POST request with addresses in body
  // Currently implementing batching to stay within 100-address GET limit
  const url = `${explorerURL}/dashboards/addresses/${addressesBatch.join(",")}?${queryParams.toString()}`;

  const response = await fetch(url);

  if (response.status >= 500) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching addresses data from the explorer");
  }

  const parsedResponse = BlockchairAddressesResponse.safeParse(await response.json());

  if (!parsedResponse.success) {
    console.warn(
      `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.error
    );
    throw new ThirdPartyProviderError("Error while parsing addresses data from the explorer");
  }

  const context = parsedResponse.data.context;
  const data = parsedResponse.data.data;

  if (!data || context.code == 404) {
    return null;
  } else if (context.code != 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.data
    );
    throw new ThirdPartyProviderError("Error in addresses data received from the explorer");
  }

  if (!context.state) {
    console.warn(`Missing current block height for chain ID ${chainId} in: ${JSON.stringify(context)}`);
    throw new ThirdPartyProviderError(`Missing current block height in data returned from explorer`);
  }

  // Custom data formatting: we need script_hex for each UTXO, so we add it manually
  data.utxo.forEach((utxo) => {
    const utxoAddress = Object.keys(data.addresses).find((address) => address === utxo.address);
    if (!utxoAddress) {
      console.warn(
        `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
        parsedResponse.data
      );
      throw new ThirdPartyProviderError("Error in addresses data received from the explorer");
    }

    utxo.script_hex = data.addresses[utxoAddress].script_hex;
  });

  return parsedResponse.data;
}

async function fetchAddressesDashboard(
  chainId: ChainId,
  addresses: string[]
): Promise<BlockchairAddressesResponse> {
  // Split addresses into batches
  const BATCH_SIZE = 100;
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    batches.push(addresses.slice(i, i + BATCH_SIZE));
  }

  // Fetch data for each batch
  const responses: BlockchairAddressesResponse[] = await Promise.all(
    batches
      .map(async (addressesBatch) => fetchAddressesBatch(chainId, addressesBatch))
      // Filter-out cases where null was returned
      .filter(Boolean) as Promise<BlockchairAddressesResponse>[]
  );

  // Merge all responses
  return responses.reduce(
    (merged, current) => ({
      ...merged,
      ...current,
    }),
    responses[0]
  );
}

async function fetchTransaction(
  chainId: ChainId,
  txHash: string
): Promise<BlockchairTransactionsResponse | null> {
  const explorerURL = CHAINS[chainId].backends.find((p: Provider) => p.type === ProviderType.blockchair)?.url;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const url = `${explorerURL}/dashboards/transaction/${txHash}?${queryParams.toString()}`;

  const response = await fetch(url);

  if (response.status >= 500) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching transaction data from the explorer");
  }

  const parsedResponse = BlockchairTransactionsResponse.safeParse(await response.json());

  if (!parsedResponse.success) {
    console.warn(
      `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.error
    );
    throw new ThirdPartyProviderError("Error while parsing transaction data from the explorer");
  }

  const context = parsedResponse.data.context;

  if (context.code == 404 || context.results === 0) {
    return null;
  } else if (context.code != 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.data
    );
    throw new ThirdPartyProviderError("Error in transaction data received from the explorer");
  }

  return parsedResponse.data;
}

// Fetches metadata for multiple transactions in a single request
// Note: Blockchair API allows batching transactions with comma-separated hashes
async function fetchTransactionsMetadataBatched(
  chainId: ChainId,
  txHashes: string[]
): Promise<BlockchairTransactionData[]> {
  const explorerURL = CHAINS[chainId].backends.find((p: Provider) => p.type === ProviderType.blockchair)?.url;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  // Split txHashes into batches
  const BATCH_SIZE = 10; // Max size accepted by Blockchair
  const batches: string[][] = [];
  for (let i = 0; i < txHashes.length; i += BATCH_SIZE) {
    batches.push(txHashes.slice(i, i + BATCH_SIZE));
  }

  let results: BlockchairTransactionData[] = [];

  // Fetch data for each batch
  for (const batch of batches) {
    // Join transaction hashes with commas for batch request
    const url = `${explorerURL}/dashboards/transactions/${batch.join(",")}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
        await response.text()
      );
      throw new ThirdPartyProviderError("Error while fetching transaction metadata from the explorer");
    }

    const parsedResponse = BlockchairTransactionsResponse.safeParse(await response.json());

    if (!parsedResponse.success) {
      console.warn(
        `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
        parsedResponse.error
      );
      throw new ThirdPartyProviderError("Error while parsing transaction data from the explorer");
    }

    const context = parsedResponse.data.context;

    if (context.code !== 200) {
      console.warn(
        `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
        parsedResponse.data
      );
      throw new ThirdPartyProviderError("Error in transaction metadata received from the explorer");
    }

    results = results.concat(Object.values(parsedResponse.data.data));
  }

  return results;
}

// This function works for both mempool and confirmed transactions
// Note: No support of batching for this endpoint
async function fetchRawTransaction(chainId: ChainId, txHash: string): Promise<BlockchairRawTransactionData> {
  const explorerURL = CHAINS[chainId].backends.find((p: Provider) => p.type === ProviderType.blockchair)?.url;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const url = `${explorerURL}/raw/transaction/${txHash}?${queryParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching raw transaction metadata from the explorer");
  }

  const parsedResponse = BlockchairRawTransactionResponse.safeParse(await response.json());

  if (!parsedResponse.success) {
    console.warn(
      `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.error
    );
    throw new ThirdPartyProviderError("Error while parsing transaction data from the explorer");
  }

  if (
    parsedResponse.data.context.code !== 200 ||
    !parsedResponse.data.data ||
    !parsedResponse.data.data[txHash]
  ) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.data
    );
    throw new ThirdPartyProviderError("Error in raw transaction metadata received from the explorer");
  }

  return parsedResponse.data.data[txHash];
}

async function fetchStats(chainId: ChainId): Promise<BlockchairStatsData> {
  const explorerURL = CHAINS[chainId].backends.find((p: Provider) => p.type === ProviderType.blockchair)?.url;
  const url = `${explorerURL}/${chainId}/stats`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching transaction metadata from the explorer");
  }

  const result = await response.json();

  return result.data;
}

async function fetchFeePerByte(chainId: ChainId): Promise<number> {
  const explorerURL = CHAINS[chainId].backends.find((p: Provider) => p.type === ProviderType.blockchair)?.url;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const url = `${explorerURL}/stats?${queryParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching fee per byte data from the explorer");
  }

  const result = await response.json();

  if (result.context.code !== 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      JSON.stringify(result)
    );
    throw new ThirdPartyProviderError("Error in fee per byte data received from the explorer");
  }

  return result.data.suggested_transaction_fee_per_byte_sat;
}

async function postTransaction(chainId: ChainId, payload: string): Promise<string> {
  const explorerURL = CHAINS[chainId].backends.find((p: Provider) => p.type === ProviderType.blockchair)?.url;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
    data: payload,
  });

  const url = `${explorerURL}/push/transaction?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "POST",
  });

  if (response.status >= 500) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error during transaction broadcast to the node");
  }

  const parsedResponse = BlockchairTransactionBroadcastStatus.safeParse(await response.json());

  if (!parsedResponse.success) {
    console.warn(
      `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.error
    );
    throw new ThirdPartyProviderError("Error while parsing response from transaction broadcast");
  }

  if (parsedResponse.data.context.code != 200 || !parsedResponse.data.data?.transaction_hash) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.data
    );
    throw new Error(`Error received from transaction broadcast: ${parsedResponse}`);
  }

  return parsedResponse.data.data.transaction_hash;
}

export {
  fetchAddressesDashboard,
  fetchFeePerByte,
  fetchRawTransaction,
  fetchStats,
  fetchTransaction,
  fetchTransactionsMetadataBatched,
  fetchXpubDashboard,
  postTransaction,
};
