import { createPublicClient, http } from "viem";
import {
  sepolia,
  mainnet,
  holesky,
  zkSync,
  zkSyncSepoliaTestnet,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  arbitrum,
  arbitrumSepolia,
} from "viem/chains";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";
import { injectiveTestnet } from "./chains/injective-testnet";

function getClientConfig(chainId: ChainId) {
  switch (chainId) {
    case ChainId.SEPOLIA:
      return {
        chain: sepolia,
        transport: http(CHAINS[chainId].backends.nodeURL),
      };
    case ChainId.ETHEREUM:
      return { chain: mainnet, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.HOLESKY:
      return { chain: holesky, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.ZKSYNC:
      return { chain: zkSync, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.ZKSYNC_SEPOLIA:
      return { chain: zkSyncSepoliaTestnet, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.INJECTIVE_TESTNET:
      return { chain: injectiveTestnet, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.BASE:
      return { chain: base, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.BASE_SEPOLIA:
      return { chain: baseSepolia, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.OPTIMISM:
      return { chain: optimism, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.OPTIMISM_SEPOLIA:
      return { chain: optimismSepolia, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.ARBITRUM:
      return { chain: arbitrum, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.ARBITRUM_SEPOLIA:
      return { chain: arbitrumSepolia, transport: http(CHAINS[chainId].backends.nodeURL) };
    default:
      throw new Error("Unsupported chainId");
  }
}

export const client = (chainId: ChainId) => {
  return createPublicClient(getClientConfig(chainId));
};
