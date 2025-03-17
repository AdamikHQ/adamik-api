import { ETHERSCAN_API_KEYS } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ChainId, Provider, ProviderType } from "~/app/model/types_WIP";
import { EtherscanERC20Event } from "./types";

// Etherscan-like explorer

// TODO Currently also used as Blockscout-like explorer for some chains, because the API is similar to Etherscan
// Not perfectly the same though, so it should probably be put in a separate explorer implem

const DEFAULT_THROTTLE = 200; // 5 calls per second
const DEFAULT_RETRIES = 5;

async function fetchWithRetries<T>(
  url: string,
  params?: RequestInit,
  retries = DEFAULT_RETRIES,
  throttle = DEFAULT_THROTTLE
): Promise<T> {
  try {
    const data = await fetch(url, params).then((response) => response.json());

    if (!Number(data.status) && data.message === "NOTOK") {
      throw new Error(`Error while fetching data from ${url}`);
    }

    return data.result;
  } catch (e) {
    if (retries) {
      // Respect the API's rate limit before trying again
      await new Promise((r) => setTimeout(r, throttle));

      console.log("Retrying... ", url);
      return fetchWithRetries<T>(url, params, --retries, throttle);
    }
    throw e;
  }
}

// TODO incremental sync? Cache known events?...
async function getERC20TransferEvents(
  chainId: ChainId,
  address: string
): Promise<Array<EtherscanERC20Event>> {
  const explorerURL = CHAINS[chainId].providers.find((p: Provider) => p.type === ProviderType.etherscan)?.url;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return [];
  }

  const url =
    explorerURL +
    "?" +
    new URLSearchParams({
      apikey: ETHERSCAN_API_KEYS.get(chainId) || "",
      module: "account",
      action: "tokentx",
      address,
      tag: "latest",
      //page: "1",
      sort: "desc",
    });

  const events = await fetchWithRetries<EtherscanERC20Event[]>(url);

  // FIXME Blockscout-type explorers mix ERC20, ERC721 and ERC1155. Need to filter-them out to only keep ERC20
  // Weak way to differenciate: ERC20 events don't contain a 'tokenID' field...
  const filteredEvents = events.filter((event) => !(event as any).tokenID);

  return filteredEvents;
}

export { getERC20TransferEvents };
