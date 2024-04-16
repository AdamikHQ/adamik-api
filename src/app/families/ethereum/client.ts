import { createPublicClient, http } from "viem";
import { sepolia, mainnet, holesky } from "viem/chains";
import { ChainId } from "~/app/model/types_WIP";

const getChainConfig = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.SEPOLIA:
      return sepolia;
    case ChainId.ETHEREUM:
      return mainnet;
    case ChainId.HOLESKY:
      return holesky;
    default:
      throw new Error("Unsupported chainId");
  }
};

export const client = (chainId: ChainId) => {
  return createPublicClient({
    chain: getChainConfig(chainId),
    transport: http(),
  });
};
