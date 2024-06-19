import { ChainId } from "~/app/model/types_WIP";
import { EvmAddress } from "../types";
import { MoralisERC20TokenBalance } from "./types";
import { MORALIS_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";

const MORALIS_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.ETHEREUM, "eth"],
  [ChainId.SEPOLIA, "sepolia"],
  [ChainId.HOLESKY, "holesky"],
  //[ChainId.POLYGON, "polygon"],
  [ChainId.ARBITRUM, "arbitrum"],
  [ChainId.ARBITRUM_SEPOLIA, "arbitrum sepolia"],
  [ChainId.OPTIMISM, "optimism"],
  [ChainId.OPTIMISM_SEPOLIA, "optimism sepolia"],
  [ChainId.BASE, "base"],
  [ChainId.BASE_SEPOLIA, "base sepolia"],
]);

async function getERC20Tokens(chainId: ChainId, address: EvmAddress): Promise<MoralisERC20TokenBalance[]> {
  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.error(`Chain ID ${chainId} is not suported by Moralis API`);
    return [];
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return [];
  }

  let tokens: MoralisERC20TokenBalance[] = [];
  let data;
  do {
    const queryParams = new URLSearchParams({
      chain: moralisChainId,
      exclude_spam: "false",
      limit: "200",
    });

    if (data?.cursor) {
      queryParams.append("cursor", data.cursor);
    }

    const url = `${explorerURL}/v2.2/wallets/${address}/tokens` + "?" + queryParams;

    const headers: RequestInit = {
      headers: {
        "X-API-Key": MORALIS_API_KEY,
      },
    };

    data = await fetch(url, headers).then((response) => response.json());

    if (!Array.isArray(data?.result)) {
      break;
    }

    tokens = tokens.concat(data.result);
  } while (data?.cursor);

  // Moralis includes an "ETH" token in the results, labeled as native_token: true
  // so we need to remove these from the results
  return tokens.filter((token: MoralisERC20TokenBalance) => !token.native_token);
}

export { getERC20Tokens };
