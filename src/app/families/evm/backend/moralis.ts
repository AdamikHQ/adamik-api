import { MORALIS_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ChainId, Token, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { EvmAddress } from "../types";
import { MoralisERC20Token, MoralisERC20TokenBalance } from "./types";

const MORALIS_CHAIN_IDS: Map<ChainId, string> = new Map([
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
  [ChainId.PALM, "palm"],
  //Mantle may not be supported yet (marked as coming soon by Moralis)
  //[ChainId.MANTLE, "mantle"],
]);

// NOTE Unused at the moment, could serve as replacement for getting transactions from the node
/*
async function fetchTransaction(chainId: ChainId, transactionId: string): Promise<MoralisDecodedTransaction | null> {
  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return null;
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return null;
  }

  const url = `${explorerURL}/v2.2/transaction/${transactionId}`;
  const headers: RequestInit = {
    headers: {
      "X-API-Key": MORALIS_API_KEY,
    },
  };

  const result: MoralisDecodedTransaction | { message: string } = await fetch(url, headers).then((response) =>
    response.json()
  );

  if ("message" in result) {
    return null;
  }

  return result;
}
*/

async function fetchERC20TokenAmounts(chainId: ChainId, address: EvmAddress): Promise<TokenAmount[]> {
  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return [];
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return [];
  }

  let tokenAmounts: TokenAmount[] = [];
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

    const results: MoralisERC20TokenBalance[] = data?.result;
    if (!Array.isArray(results)) {
      break;
    }

    results
      // Moralis includes an "ETH" token in the results, labeled as native_token: true
      // so we need to remove these from the results
      ?.filter((tokenData: MoralisERC20TokenBalance) => !tokenData.native_token)
      .forEach((result) =>
        tokenAmounts.push({
          token: {
            chainId,
            type: TokenType.ERC20,
            id: result.token_address,
            name: result.name,
            decimals: result.decimals,
            ticker: result.symbol,
            contractAddress: result.token_address,
          },
          amount: BigInt(result.balance),
        })
      );
  } while (data?.cursor);

  return tokenAmounts;
}

async function fetchERC20Token(chainId: ChainId, tokenId: EvmAddress): Promise<Token | null> {
  const moralisChainId = MORALIS_CHAIN_IDS.get(chainId);
  if (!moralisChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Moralis API`);
    return null;
  }

  const explorerURL = CHAINS[chainId].backends.explorerURL;
  if (!explorerURL) {
    console.warn(`/!\\ Chain ${chainId} has no defined explorer`);
    return null;
  }

  const queryParams = new URLSearchParams({
    chain: moralisChainId,
    "addresses[0]": tokenId,
  });

  const url = `${explorerURL}/v2.2/erc20/metadata` + "?" + queryParams;

  const headers: RequestInit = {
    headers: {
      "X-API-Key": MORALIS_API_KEY,
    },
  };

  // (array destructuring, we only need the 1st item)
  const [result]: [MoralisERC20Token] = await fetch(url, headers).then((response) => response.json());

  return {
    chainId: chainId,
    type: TokenType.ERC20,
    id: result.address,
    name: result.name,
    ticker: result.symbol,
    decimals: result.decimals,
    contractAddress: result.address,
  };
}

export { fetchERC20Token, fetchERC20TokenAmounts };
