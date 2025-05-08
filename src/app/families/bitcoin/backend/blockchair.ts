import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { fetchBabylonDelegation } from "~/app/families/babylon/backend/babylonAPI";
import {
  AccountState,
  ChainId,
  FinalizedTransaction,
  ProviderType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { getProviderUrls } from "../../common";
import { BitcoinChainParams, UtxoWithMetadata, Xpub } from "../types";
import {
  BlockchairAddressesResponse,
  BlockchairRawTransactionData,
  BlockchairRawTransactionResponse,
  BlockchairStatsData,
  BlockchairTransactionBroadcastStatus,
  BlockchairTransactionData,
  BlockchairTransactionsResponse,
  BlockchairXpubResponse,
} from "./blockchair.types";
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
async function fetchXpubUTXOs(chainId: ChainId, xpub: Xpub): Promise<UtxoWithMetadata[]> {
  const explorerURL = getProviderUrls(chainId, ProviderType.blockchair)[0];
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

  return data.utxo;
}

async function fetchAddressUTXOs(chainId: ChainId, address: string): Promise<UtxoWithMetadata[]> {
  const explorerURL = getProviderUrls(chainId, ProviderType.blockchair)[0];
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const url = `${explorerURL}/dashboards/addresses/${address}?${queryParams.toString()}`;

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

  if (context.code == 404 || !data) {
    return [];
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

  return data.utxo;
}

async function fetchXpubData(chainId: ChainId, xpub: Xpub): Promise<AccountState> {
  const utxos = await fetchXpubUTXOs(chainId, xpub);
  return utxosToAccountState(chainId, utxos);
}

async function fetchAddressData(chainId: ChainId, address: string): Promise<AccountState> {
  const utxos = await fetchAddressUTXOs(chainId, address);
  return utxosToAccountState(chainId, utxos);
}

// Unused at the moment, multiple addresses are not supported
/*
async function fetchAddressesUTXOs(chainId: ChainId, addresses: string[]): Promise<UtxoWithMetadata[]> {
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
  const aggregated = responses.reduce(
    (merged, current) => ({
      ...merged,
      ...current,
    }),
    responses[0]
  );

  return aggregated.data.utxo;
}

async function fetchAddressesBatch(
  chainId: ChainId,
  addressesBatch: string[]
): Promise<BlockchairAddressesResponse | null> {
  const explorerURL = CHAINS[chainId].providers.find(
    (p: Provider) => p.type === ProviderType.blockchair
  )?.url;
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
*/

async function fetchTransaction(
  chainId: ChainId,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  const explorerURL = getProviderUrls(chainId, ProviderType.blockchair)[0];
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const url = `${explorerURL}/dashboards/transaction/${transactionId}?${queryParams.toString()}`;

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

  if (!parsedResponse?.data || Array.isArray(parsedResponse.data)) {
    return null;
  }

  const context = parsedResponse.data.context;

  if (context.code == 404 || context.results === 0) {
    return null;
  } else if (context.code != 200) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse?.data
    );
    throw new ThirdPartyProviderError("Error in transaction data received from the explorer");
  }

  return await blockchairToAdamikTransaction(chainId, parsedResponse.data.data[transactionId]);
}

// Fetches metadata for multiple transactions in a single request
// Note: Blockchair API allows batching transactions with comma-separated hashes
async function fetchTransactionsMetadataBatched(
  chainId: ChainId,
  transactionIds: string[]
): Promise<BlockchairTransactionData[]> {
  const explorerURL = getProviderUrls(chainId, ProviderType.blockchair)[0];
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  // Split transactionIds into batches
  const BATCH_SIZE = 10; // Max size accepted by Blockchair
  const batches: string[][] = [];
  for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
    batches.push(transactionIds.slice(i, i + BATCH_SIZE));
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
async function fetchRawTransaction(
  chainId: ChainId,
  transactionId: string
): Promise<BlockchairRawTransactionData> {
  const explorerURL = getProviderUrls(chainId, ProviderType.blockchair)[0];
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const url = `${explorerURL}/raw/transaction/${transactionId}?${queryParams.toString()}`;

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
    !parsedResponse.data.data[transactionId]
  ) {
    console.warn(
      `/!\\ Error in data received from ${chainId} explorer endpoint ${url.toString()}:`,
      parsedResponse.data
    );
    throw new ThirdPartyProviderError("Error in raw transaction metadata received from the explorer");
  }

  return parsedResponse.data.data[transactionId];
}

async function fetchLatestBlockHeight(chainId: ChainId): Promise<number> {
  const explorerURL = getProviderUrls(chainId, ProviderType.blockchair)[0];
  const url = `${explorerURL}/${chainId}/stats`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `/!\\ Invalid response from ${chainId} explorer endpoint ${url.toString()}:`,
      await response.text()
    );
    throw new ThirdPartyProviderError("Error while fetching transaction metadata from the explorer");
  }

  const result: { data: BlockchairStatsData } = await response.json();

  // -1 because blocks is the total nb of blocks, and block height starts at #0
  return result.data.blocks - 1;
}

async function fetchFeePerByte(chainId: ChainId): Promise<{ slow: number; medium: number; fast: number }> {
  const explorerURL = getProviderUrls(chainId, ProviderType.blockchair)[0];
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

  return {
    slow: result.data.suggested_transaction_fee_per_byte_sat,
    medium: result.data.suggested_transaction_fee_per_byte_sat,
    fast: result.data.suggested_transaction_fee_per_byte_sat,
  };
}

async function postTransaction(chainId: ChainId, payload: string): Promise<string> {
  const explorerURL = getProviderUrls(chainId, ProviderType.blockchair)[0];
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

async function utxosToAccountState(chainId: ChainId, utxos: UtxoWithMetadata[]): Promise<AccountState> {
  const chainParams = CHAINS[chainId].params as BitcoinChainParams;

  const latestBlockHeight = await fetchLatestBlockHeight(chainId);

  const { confirmedBalance, unconfirmedBalance } = utxos
    // FIXME Is this required??
    //.filter((utxo) => utxo.address === address)
    .reduce(
      (acc, utxo) => {
        // Pure mempool transactions should ALWAYS be counted as unconfirmed
        if (utxo.block_id === -1) {
          acc.unconfirmedBalance += BigInt(utxo.value);
          return acc;
        }

        // For transactions in blocks, check if they have enough confirmations
        if (latestBlockHeight - utxo.block_id + 1 < chainParams.confirmations) {
          acc.unconfirmedBalance += BigInt(utxo.value);
        } else {
          acc.confirmedBalance += BigInt(utxo.value);
        }
        return acc;
      },
      { confirmedBalance: 0n, unconfirmedBalance: 0n }
    );

  return {
    balances: {
      native: {
        available: confirmedBalance,
        unconfirmed: unconfirmedBalance,
        total: confirmedBalance + unconfirmedBalance,
      },
    },
  };
}

async function blockchairToAdamikTransaction(
  chainId: ChainId,
  blockchairTransaction: BlockchairTransactionData
): Promise<FinalizedTransaction> {
  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: blockchairTransaction.transaction.hash,
    mode: TransactionMode.TRANSFER,
    state: TransactionState.UNKNOWN,
    fees: {
      amount: blockchairTransaction.transaction.fee,
    },
    senders: blockchairTransaction.inputs.map((input) => ({
      address: input.recipient,
      amount: input.value,
    })),
    recipients: blockchairTransaction.outputs.map((output) => ({
      address: output.recipient,
      amount: output.value,
    })),
  };

  const transactionBlockHeight = blockchairTransaction.transaction.block_id;
  if (transactionBlockHeight === undefined || transactionBlockHeight === -1) {
    parsedTransaction.state = TransactionState.PENDING;
  } else {
    const bitcoinParams = CHAINS[chainId].params as BitcoinChainParams;
    const latestBlockHeight = await fetchLatestBlockHeight(chainId);
    const isTransactionConfirmed = latestBlockHeight - transactionBlockHeight >= bitcoinParams.confirmations;

    parsedTransaction.state = isTransactionConfirmed
      ? TransactionState.CONFIRMED
      : TransactionState.UNCONFIRMED;

    // NOTE Blockchair returns transaction time in a bad format, e.g: "2024-09-10 11:05:14"
    // instead of a timestamp or a proper ISO string: "2024-09-10T11:05:14.000Z"
    // This format is ambiguous about the timezone, so we have to append 'UTC' for Date to handle it correctly...
    parsedTransaction.timestamp = new Date(blockchairTransaction.transaction.time + " UTC").getTime();
    parsedTransaction.blockHeight = BigInt(blockchairTransaction.transaction.block_id);
  }

  // Babylon Staking - poll the babylon backend to check whether it's a staking tx
  const babylonDelegationFound = await fetchBabylonDelegation(
    chainId,
    blockchairTransaction.transaction.hash
  );
  if (babylonDelegationFound) {
    // FIXME We can only identify 'staking' transactions,
    // found no way to identify 'unbonding' and 'withdrawal' transactions...
    parsedTransaction.mode = TransactionMode.STAKE;

    parsedTransaction.validators = {
      target: {
        address: babylonDelegationFound.data.finality_provider_btc_pks_hex[0],
        //amount: BigInt(mempoolSpaceTransaction.vout[0].value),
      },
    };
  }

  return {
    parsed: parsedTransaction,
    raw: blockchairTransaction,
  };
}

export {
  fetchAddressData,
  fetchAddressUTXOs,
  fetchFeePerByte,
  fetchLatestBlockHeight,
  fetchRawTransaction,
  fetchTransaction,
  fetchTransactionsMetadataBatched,
  fetchXpubData,
  fetchXpubUTXOs,
  postTransaction,
};
