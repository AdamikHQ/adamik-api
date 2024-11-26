import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";
import { Xpub } from "../types";
import {
  BlockchairAddressesResponse,
  BlockchairTransactionResponse,
  BlockchairXpubResponse,
  TransactionBroadcastStatus,
} from "./types";

const queryParams = new URLSearchParams({
  key: BLOCKCHAIR_API_KEY,
});

// TODO Need proper mapping between Adamik ChainID <> Blockchair ChainID (to support more than bitcoin)

// FIXME: add correct fetch parsing + validation + error handling

async function fetchStats(chainId: ChainId) {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const url = `/${chainId}/stats`;

  const response = await fetch(explorerURL + url);

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
 * Fetches xpub data from Blockchair API
 *
 * LIMITATIONS:
 * 1. This endpoint only returns UTXOs that are included in blocks
 *    - Includes confirmed UTXOs (confirmations >= 6)
 *    - Includes partially confirmed UTXOs (0 < confirmations < 6)
 *    - Does NOT include mempool transactions (confirmations = 0)
 *
 * 2. To get a complete view including mempool transactions:
 *    - Use the list of checked addresses from the response
 *    - Query these addresses via fetchAddressesDashboard()
 *    - Filter for block_id === -1 to find mempool transactions
 */
async function fetchXpubDashboard(chainId: ChainId, xpub: Xpub): Promise<BlockchairXpubResponse> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  const url = `/dashboards/xpub/${xpub}?${queryParams.toString()}`;
  const response = await fetch(explorerURL + url);

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
  // FIXME: use POST instead of GET and put addresses in the body
  const url = `/dashboards/addresses/${addresses.join(",")}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

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
}

async function postTransaction(chainId: ChainId, signedTransaction: string): Promise<string> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  queryParams.set("data", signedTransaction);
  const url = `/push/transaction?${queryParams.toString()}`;

  const response = await fetch(`${explorerURL + url}`, {
    method: "POST",
  });

  if (response.status >= 500) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new Error("Error during transaction broadcast to the node");
  }

  const result = TransactionBroadcastStatus.safeParse(await response.json());

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
    throw new Error("Error in response data received from transaction broadcast");
  }

  return result.data.data.transaction_hash;
}

async function fetchFeePerByte(chainId: ChainId): Promise<number> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;

  const url = `/stats?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

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
  const url = `/dashboards/transaction/${txHash}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

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

async function fetchTransactionMetadata(
  chainId: ChainId,
  txHash: string
): Promise<{
  [key: string]: {
    has_witness: boolean;
    outputs: [
      {
        index: number;
        script_hex: string;
        // ... other fields are not used for now
      }
    ];
    // ... other fields are not used for now
  };
}> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const url = `/dashboards/transaction/${txHash}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

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

  return result.data;
}

async function fetchRawTransactionMetadata(
  chainId: ChainId,
  txHash: string
): Promise<{
  [key: string]: {
    // key is tx_hash
    raw_transaction: string;
    /// ... other fields are not used for now
  };
}> {
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  const url = `/raw/transaction/${txHash}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new Error("Error while fetching raw transaction metadata from the explorer");
  }

  const result = await response.json();

  if (result.context.code !== 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      JSON.stringify(result)
    );
    throw new Error("Error in raw transaction metadata received from the explorer");
  }

  return result.data;
}

/**
 * Get current block height from API response context (instead of using fetchStats for fresh blockchain data)
 *
 * Note: For mempool-only transactions (block_id = -1), the API doesn't return block height
 * In this case, we return MAX_SAFE_INTEGER to ensure these are counted as unconfirmed
 */
async function getCurrentBlockHeight(
  chainId: ChainId,
  response: {
    context: { state?: number };
    data?: {
      utxo?: { block_id: number }[];
      [key: string]: any; // For xpub response which has a dynamic key
    } | null;
  }
): Promise<number> {
  // Check if we have any non-mempool transactions
  const utxos =
    "utxo" in (response.data || {})
      ? response.data?.utxo // Address response
      : Object.values(response.data || {})[0]?.utxo; // Xpub response

  const hasNonMempoolTx = utxos?.some((utxo: { block_id: number }) => utxo.block_id !== -1);

  // For mempool-only transactions, return MAX_SAFE_INTEGER
  if (!hasNonMempoolTx) {
    return Number.MAX_SAFE_INTEGER;
  }

  // For transactions in blocks, we need the block height
  if (!response.context.state) {
    console.warn(`Missing current block height: ${JSON.stringify(response)}`);
    throw new Error(`Explorer error: missing current block height`);
  }
  return response.context.state;
}

export {
  fetchAddressesDashboard,
  fetchFeePerByte,
  fetchRawTransactionMetadata,
  fetchStats,
  fetchTransaction,
  fetchTransactionMetadata,
  fetchXpubDashboard,
  getCurrentBlockHeight,
  postTransaction,
};
