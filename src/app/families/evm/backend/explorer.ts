import { ChainId } from "~/app/model/types_WIP";
import { EtherscanERC20Event } from "./types";
import { CHAINS } from "~/app/config/chains";
import { EXPLORER_API_KEYS } from "~/app/config/apiKeys";

// Etherscan-like explorer

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
      await setTimeout(() => null, throttle);

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
  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`Chain ${chainId} has no defined explorer`);
    return [];
  }

  const url =
    explorerURL +
    "?" +
    new URLSearchParams({
      apikey: EXPLORER_API_KEYS.get(chainId) || "",
      module: "account",
      action: "tokentx",
      address,
      tag: "latest",
      //page: "1",
      sort: "desc",
    });

  return await fetchWithRetries<EtherscanERC20Event[]>(url);
}

export { getERC20TransferEvents };
