import { createPublicClient, http } from "viem";
import { sepolia, mainnet, holesky, zkSync, zkSyncSepoliaTestnet } from "viem/chains";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";
import { injectiveTestnet } from "./chains/injective-testnet";

const getChainConfig = (chainId: ChainId) => {
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
    case ChainId.ZKSYNC_TESTNET:
      return { chain: zkSyncSepoliaTestnet, transport: http(CHAINS[chainId].backends.nodeURL) };
    case ChainId.INJECTIVE_TESTNET:
      return { chain: injectiveTestnet, transport: http() };
    default:
      throw new Error("Unsupported chainId");
  }
};

export const client = (chainId: ChainId) => {
  return createPublicClient(getChainConfig(chainId));
};
