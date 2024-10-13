import { CHAINS } from "~/app/config/chains";
import { AccountHistoryPagination, ChainId } from "~/app/model/types_WIP";
import { MintscanTransaction } from "./types";

const getRootUrl = (chainId: ChainId) => CHAINS[chainId].backends.explorerURL;

// TODO Use this
const MINTSCAN_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.ETHEREUM, "eth"],
  [ChainId.SEPOLIA, "sepolia"],
  [ChainId.HOLESKY, "holesky"],
  [ChainId.POLYGON, "polygon"],
  [ChainId.POLYGON_AMOY, "polygon amoy"],
  [ChainId.ARBITRUM, "arbitrum"],
  // no indexer for Sepolia with Moralis, to update later or switch to Etherscan
  // [ChainId.ARBITRUM_SEPOLIA, "arbitrum sepolia"],
  [ChainId.OPTIMISM, "optimism"],
  // no indexer for Sepolia with Moralis, to update later or switch to Etherscan
  // [ChainId.OPTIMISM_SEPOLIA, "optimism sepolia"],
  [ChainId.BASE, "base"],
  [ChainId.BASE_SEPOLIA, "base sepolia"],
  [ChainId.BSC, "bsc"],
  [ChainId.BSC_TESTNET, "bsc testnet"],
  [ChainId.LINEA, "linea"],
  [ChainId.LINEA_SEPOLIA, "linea sepolia"],
  [ChainId.AVALANCHE, "avalanche"],
  [ChainId.GNOSIS, "gnosis"],
  [ChainId.GNOSIS_CHIADO, "gnosis testnet"],
  [ChainId.MOONBEAM, "moonbeam"],
  [ChainId.MOONRIVER, "moonriver"],
  [ChainId.MOONBASE, "moonbase"],
  [ChainId.FANTOM, "fantom"],
  //Mantle may not be supported yet (marked as coming soon by Moralis)
  //[ChainId.MANTLE, "mantle"],
]);

async function fetchWithPagination<T>(chainId: ChainId, urlString: string, dataKey: string): Promise<T[]> {
  const url = new URL(urlString);

  let data: T[] = [];
  let response;
  do {
    if (response?.pagination?.searchAfter) {
      // TODO Test this
      url.searchParams.set("searchAfter", response.pagination.searchAfter);
    }

    response = await fetch(url.toString()).then((response) => response.json());

    if (!response || !Array.isArray(response[dataKey])) {
      console.warn(`/!\\ Invalid response from ${chainId} node endpoint: ${url.toString()}:`, response);
      break;
    }

    data = data.concat(response[dataKey]);
  } while (response?.pagination?.next_key);

  return data;
}

async function fetchAccountTransactions(
  chainId: ChainId,
  address: string,
  pagination: AccountHistoryPagination
): Promise<MintscanTransaction[]> {
  const searchParams = new URLSearchParams();

  // TODO Test this
  pagination.fromTimestamp && searchParams.set("fromDateTime", timestampToDate(pagination.fromTimestamp));
  pagination.toTimestamp && searchParams.set("toDateTime", timestampToDate(pagination.toTimestamp));

  const url = `${getRootUrl(chainId)}/${chainId}/account/${address}/transactions?` + searchParams;

  // FIXME DEBUG TBR
  console.log("XXX - fetchAccountTransactions - url:", url);

  const mintscanTransactions = await fetchWithPagination<MintscanTransaction>(chainId, url, "transactions");

  return mintscanTransactions;
}

/**
 * @timestamp in milliseconds
 * @returns the corresponding date in format "YYYY-MM-DD", as required by mintscan
 */
function timestampToDate(timestamp: number): string {
  const date = new Date(timestamp);

  return (
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date.getDate().toString().padStart(2, "0")
  );
}

export { fetchAccountTransactions };
