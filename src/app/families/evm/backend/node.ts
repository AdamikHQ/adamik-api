import { createPublicClient, erc20Abi, http } from "viem";
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
import { injectiveTestnet } from "../chains/injective-testnet";
import { EvmAddress } from "../types";

// Couldn't find a proper type that works besides 'any'
const CLIENTS = new Map<ChainId, any>();

function getNodeClientConfig(chainId: ChainId) {
  switch (chainId) {
    case ChainId.SEPOLIA:
      return { chain: sepolia, transport: http(CHAINS[chainId].backends.nodeURL) };
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

function getNodeClient(chainId: ChainId) {
  if (CLIENTS.has(chainId)) {
    return CLIENTS.get(chainId)!;
  } else {
    const client = createPublicClient(getNodeClientConfig(chainId));
    CLIENTS.set(chainId, client);
    return client;
  }
}

async function makeContractCall(
  chainId: ChainId,
  contractAdress: EvmAddress,
  functionName: string,
  args: unknown[] = []
): Promise<unknown | null> {
  const client = getNodeClient(chainId);

  let value;
  try {
    value = await client.readContract({
      address: contractAdress,
      abi: erc20Abi,
      functionName,
      args,
    });
  } catch (e) {
    console.warn(`/!\\ ${functionName} call failed on contract ${contractAdress} for chain ${chainId}`);
    throw e;
  }

  return value;
}

async function getERC20name(chainId: ChainId, contractAdress: EvmAddress): Promise<string> {
  return (await makeContractCall(chainId, contractAdress, "name")) as string;
}

async function getERC20Decimals(chainId: ChainId, contractAdress: EvmAddress): Promise<number> {
  return (await makeContractCall(chainId, contractAdress, "decimals")) as number;
}

async function getERC20Ticker(chainId: ChainId, contractAdress: EvmAddress): Promise<string> {
  return (await makeContractCall(chainId, contractAdress, "symbol")) as string;
}

async function getERC20Balance(
  chainId: ChainId,
  contractAdress: EvmAddress,
  address: EvmAddress
): Promise<bigint> {
  return (await makeContractCall(chainId, contractAdress, "balanceOf", [address])) as bigint;
}

export { getNodeClient, getERC20name, getERC20Decimals, getERC20Ticker, getERC20Balance };
