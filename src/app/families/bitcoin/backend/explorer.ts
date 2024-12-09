import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";
import { Xpub } from "../types";
import {
  BlockchairAddressesResponse,
  BlockchairTransactionBroadcastStatus,
  BlockchairTransactionResponse,
  BlockchairXpubResponse,
} from "./types";

// TODO Need proper mapping between Adamik ChainID <> Blockchair ChainID (to support more than bitcoin)

// FIXME: add correct fetch parsing + validation + error handling

async function fetchStats(chainId: ChainId) {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const url = `${explorerURL}/${chainId}/stats`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new Error("Error while fetching transaction metadata from the explorer");
  }

  const result = await response.json();

  return result.data;
}

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

async function fetchXpubDashboard(chainId: ChainId, xpub: Xpub): Promise<BlockchairXpubResponse> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
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
    throw new Error("Error while fetching Xpub data from the explorer");
  }

  const result = BlockchairXpubResponse.safeParse(await response.json());

  if (!result.success) {
    console.warn(
      `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
      result.error
    );
    throw new Error("Error while parsing Xpub data from the explorer");
  }

  if (result.data.context.code != 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      result.data.context.error
    );
    throw new Error("Error in Xpub data received from the explorer");
  }
  return result.data;
}

async function fetchAddressesDashboard(
  chainId: ChainId,
  addresses: string[]
): Promise<BlockchairAddressesResponse> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const BATCH_SIZE = 100;

  // If no addresses, return early
  if (addresses.length === 0) {
    return {
      context: { code: 200, request_cost: 1 },
      data: null,
    };
  }

  // Split addresses into batches
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    batches.push(addresses.slice(i, i + BATCH_SIZE));
  }

  // Fetch data for each batch
  const responses = await Promise.all(
    batches.map(async (batchAddresses) => {
      const queryParams = new URLSearchParams({
        key: BLOCKCHAIR_API_KEY,
      });

      // FIXME: If/when Blockchair supports it, switch to POST request with addresses in body
      // Currently implementing batching to stay within 100-address GET limit
      const url = `${explorerURL}/dashboards/addresses/${batchAddresses.join(",")}?${queryParams.toString()}`;
      const response = await fetch(url);

      if (response.status >= 500) {
        console.warn(
          `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
          await response.text()
        );
        throw new Error("Error while fetching addresses data from the explorer");
      }

      const result = BlockchairAddressesResponse.safeParse(await response.json());

      if (!result.success) {
        console.warn(
          `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
          result.error
        );
        throw new Error("Error while parsing addresses data from the explorer");
      }

      if (result.data.context.code == 404) {
        return {
          context: result.data.context,
          data: null,
        };
      } else if (result.data.context.code != 200) {
        console.warn(
          `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
          result.data.context.error
        );
        throw new Error("Error in addresses data received from the explorer");
      }

      return result.data;
    })
  );

  // Merge all responses
  return responses.reduce((merged, current) => {
    if (!merged) {
      return current;
    }

    // Merge data from current response into accumulated result
    if (merged.data && current.data) {
      merged.data = {
        ...merged.data,
        utxo: [...(merged.data.utxo || []), ...(current.data.utxo || [])],
      };
    }
    return merged;
  });
}

async function postTransaction(chainId: ChainId, signedTransaction: string): Promise<string> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
    data: signedTransaction,
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
    throw new Error("Error during transaction broadcast to the node");
  }

  const result = BlockchairTransactionBroadcastStatus.safeParse(await response.json());

  if (!result.success) {
    console.warn(
      `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
      result.error
    );
    throw new Error("Error while parsing response from transaction broadcast");
  }

  if (result.data.context.code != 200 || !result.data.data?.transaction_hash) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      result.data.context.error
    );
    throw new Error(`Error in response received from transaction broadcast: ${result}`);
  }

  return result.data.data.transaction_hash;
}

async function fetchFeePerByte(chainId: ChainId): Promise<number> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
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
    throw new Error("Error while fetching fee per byte data from the explorer");
  }

  const result = await response.json();

  if (result.context.code !== 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      JSON.stringify(result)
    );
    throw new Error("Error in fee per byte data received from the explorer");
  }

  return result.data.suggested_transaction_fee_per_byte_sat;
}

async function fetchTransaction(chainId: ChainId, txHash: string): Promise<BlockchairTransactionResponse> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
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
    throw new Error("Error while fetching transaction data from the explorer");
  }

  const result = BlockchairTransactionResponse.safeParse(await response.json());

  if (!result.success) {
    console.warn(
      `/!\\ Error while parsing response from ${chainId} explorer endpoint ${url.toString()}:`,
      result.error
    );
    throw new Error("Error while parsing transaction data from the explorer");
  }

  if (result.data.context.code == 404 || result.data.context.results === 0) {
    return {
      context: result.data.context,
      data: null,
    };
  } else if (result.data.context.code != 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      result.data.context.error
    );
    throw new Error("Error in transaction data received from the explorer");
  }

  return result.data;
}

// This function works for both mempool and confirmed transactions
async function fetchRawTransactionMetadata(chainId: ChainId, txHash: string): Promise<string> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
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
    throw new Error("Error while fetching raw transaction metadata from the explorer");
  }

  const result = await response.json();

  if (result.context.code !== 200 || !result.data || !result.data[txHash]) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      JSON.stringify(result)
    );
    throw new Error("Error in raw transaction metadata received from the explorer");
  }

  return result.data[txHash].raw_transaction;
}

/**
 * Fetches metadata for multiple transactions in a single request
 * Note: Blockchair API allows batching transactions with comma-separated hashes
 */
async function fetchBatchTransactionMetadata(
  chainId: ChainId,
  txHashes: string[]
): Promise<
  Record<
    string,
    {
      transaction: {
        has_witness: boolean;
      };
      outputs: Array<{
        index: number;
        script_hex: string;
        spending_witness: string;
      }>;
    }
  >
> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const BATCH_SIZE = 10; // Max size accepted by Blockchair
  const batches: string[][] = [];

  // Split txHashes into batches
  for (let i = 0; i < txHashes.length; i += BATCH_SIZE) {
    batches.push(txHashes.slice(i, i + BATCH_SIZE));
  }

  const results: Record<string, any> = {};

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
      throw new Error("Error while fetching transaction metadata from the explorer");
    }

    const result = await response.json();

    if (result.context.code !== 200) {
      console.warn(
        `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
        JSON.stringify(result)
      );
      throw new Error("Error in transaction metadata received from the explorer");
    }

    // Merge the current batch result into the final results
    Object.assign(results, result.data);
  }

  return results;
}

export {
  fetchAddressesDashboard,
  fetchBatchTransactionMetadata,
  fetchFeePerByte,
  fetchRawTransactionMetadata,
  fetchStats,
  fetchTransaction,
  fetchXpubDashboard,
  postTransaction,
};
