import { ChainId } from "~/app/model/types_WIP";
import { EvmAddress } from "../types";
import { MoralisERC20TokenBalance } from "./types";
import { MORALIS_API_KEY } from "~/app/config/apiKeys";

const MORALIS_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.ETHEREUM, "eth"],
  [ChainId.SEPOLIA, "sepolia"],
  [ChainId.HOLESKY, "holesky"],
  //[ChainId.POLYGON, "polygon"],
  [ChainId.ARBITRUM, "arbitrum"],
  [ChainId.ARBITRUM_SEPOLIA, "arbitrum%20sepolia"],
  [ChainId.OPTIMISM, "optimism"],
  [ChainId.OPTIMISM_SEPOLIA, "optimism%20sepolia"],
  [ChainId.BASE, "base"],
  [ChainId.BASE_SEPOLIA, "base%20sepolia"],
]);

async function getERC20Tokens(chainId: ChainId, address: EvmAddress): Promise<MoralisERC20TokenBalance[]> {
  const chain = MORALIS_CHAIN_IDS.get(chainId);
  if (!chain) {
    console.error(`Chain ID ${chainId} is not suported by Moralis API`);
    return [];
  }

  const url =
    `https://deep-index.moralis.io/api/v2.2/${address}/erc20` +
    "?" +
    new URLSearchParams({
      chain,
      exclude_spam: "true",
    });

  const params: RequestInit = {
    headers: {
      "X-API-Key": MORALIS_API_KEY,
    },
  };

  const data = await fetch(url, params).then((response) => response.json());

  return data.message ? [] : data;
}

export { getERC20Tokens };
