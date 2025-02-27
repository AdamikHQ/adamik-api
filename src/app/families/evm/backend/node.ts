import { createPublicClient, erc20Abi, FeeValuesEIP1559, http } from "viem";
import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  base,
  baseSepolia,
  berachainTestnetbArtio,
  bsc,
  bscTestnet,
  chiliz,
  fantom,
  gnosis,
  gnosisChiado,
  holesky,
  linea,
  lineaSepolia,
  mainnet,
  mantle,
  moonbeam,
  moonbeamDev,
  moonriver,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  rootstock,
  rootstockTestnet,
  sepolia,
  zksync,
  zksyncSepoliaTestnet,
} from "viem/chains";
import { publicActionsL2 } from "viem/op-stack";
import { CHAINS } from "~/app/config/chains";
import {
  Backend,
  ChainId,
  FinalizedTransaction,
  ProviderType,
  Token,
  TokenType,
  TransactionMode,
} from "~/app/model/types_WIP";
import { avalancheFujiTesnet } from "../chains/avalanche-fuji--testnet";
import { chilizTestnet } from "../chains/chiliz-testnet";
import { injectiveEvmTestnet } from "../chains/injective-evm-testnet";
import { monadTestnet } from "../chains/monad-testnet";
import { berachain } from "../chains/berachain";
import { EvmAddress, EvmChainParams } from "../types";
import { TokenStore } from "~/app/tools/tokenStore";

// FIXME Couldn't find a proper type that works besides 'any'
const CLIENTS = new Map<ChainId, any>();

function getClientConfig(chainId: ChainId) {
  const nodeURL = CHAINS[chainId].backends.find((b: Backend) => b.providerType === ProviderType.node)?.url;
  const transport = http(nodeURL);

  switch (chainId) {
    case ChainId.SEPOLIA:
      return { chain: sepolia, transport };
    case ChainId.ETHEREUM:
      return { chain: mainnet, transport };
    case ChainId.HOLESKY:
      return { chain: holesky, transport };
    case ChainId.ZKSYNC:
      return { chain: zksync, transport };
    case ChainId.ZKSYNC_SEPOLIA:
      return { chain: zksyncSepoliaTestnet, transport };
    case ChainId.INJECTIVE_EVM_TESTNET:
      return { chain: injectiveEvmTestnet, transport };
    case ChainId.BASE:
      return { chain: base, transport };
    case ChainId.BASE_SEPOLIA:
      return { chain: baseSepolia, transport };
    case ChainId.BERACHAIN_ARTIO:
      return { chain: berachainTestnetbArtio, transport };
    case ChainId.OPTIMISM:
      return { chain: optimism, transport };
    case ChainId.OPTIMISM_SEPOLIA:
      return { chain: optimismSepolia, transport };
    case ChainId.ARBITRUM:
      return { chain: arbitrum, transport };
    case ChainId.ARBITRUM_SEPOLIA:
      return { chain: arbitrumSepolia, transport };
    case ChainId.POLYGON:
      return { chain: polygon, transport };
    case ChainId.POLYGON_AMOY:
      return { chain: polygonAmoy, transport };
    case ChainId.BSC:
      return { chain: bsc, transport };
    case ChainId.BSC_TESTNET:
      return { chain: bscTestnet, transport };
    case ChainId.LINEA:
      return { chain: linea, transport };
    case ChainId.LINEA_SEPOLIA:
      return { chain: lineaSepolia, transport };
    case ChainId.AVALANCHE:
      return { chain: avalanche, transport };
    case ChainId.GNOSIS:
      return { chain: gnosis, transport };
    case ChainId.GNOSIS_CHIADO:
      return { chain: gnosisChiado, transport };
    case ChainId.MOONBEAM:
      return { chain: moonbeam, transport };
    case ChainId.MOONRIVER:
      return { chain: moonriver, transport };
    case ChainId.MOONBASE:
      return { chain: moonbeamDev, transport };
    case ChainId.FANTOM:
      return { chain: fantom, transport };
    case ChainId.MANTLE:
      return { chain: mantle, transport };
    case ChainId.CHILIZ:
      return { chain: chiliz, transport };
    case ChainId.CHILIZ_TESTNET:
      return { chain: chilizTestnet, transport };
    case ChainId.ROOTSTOCK:
      return { chain: rootstock, transport };
    case ChainId.ROOTSTOCK_TESTNET:
      return { chain: rootstockTestnet, transport };
    case ChainId.AVALANCHE_FUJI:
      return { chain: avalancheFujiTesnet, transport };
    case ChainId.MONAD_TESTNET:
      return { chain: monadTestnet, transport };
    case ChainId.BERACHAIN:
      return { chain: berachain, transport };
    default:
      throw new Error("Unsupported chainId for Viem client");
  }
}

function getClient(chainId: ChainId) {
  if (CLIENTS.has(chainId)) {
    return CLIENTS.get(chainId)!;
  } else {
    const chainParams = CHAINS[chainId].params as EvmChainParams;
    const client = chainParams?.isL2Fees
      ? createPublicClient(getClientConfig(chainId)).extend(publicActionsL2())
      : createPublicClient(getClientConfig(chainId));
    CLIENTS.set(chainId, client);
    return client;
  }
}

async function estimateGas({
  chainId,
  senderAddress,
  recipientAddress,
  amount,
}: {
  chainId: ChainId;
  senderAddress: EvmAddress;
  recipientAddress: EvmAddress;
  amount: bigint;
}): Promise<bigint> {
  return await getClient(chainId).estimateGas({
    account: senderAddress,
    to: recipientAddress,
    value: amount,
  });
}

async function estimateERC20Gas({
  chainId,
  contractAddress,
  senderAddress,
  recipientAddress,
  amount,
}: {
  chainId: ChainId;
  contractAddress: EvmAddress;
  senderAddress: EvmAddress;
  recipientAddress: EvmAddress;
  amount: bigint;
}): Promise<bigint> {
  return await getClient(chainId).estimateContractGas({
    address: contractAddress,
    abi: erc20Abi,
    functionName: "transfer",
    account: senderAddress,
    args: [recipientAddress, amount],
  });
}

async function estimateFeesPerGas(chainId: ChainId): Promise<FeeValuesEIP1559> {
  return await getClient(chainId).estimateFeesPerGas();
}

async function estimateFeesForL2({
  chainId,
  senderAddress,
  recipientAddress,
  amount,
}: {
  chainId: ChainId;
  senderAddress: EvmAddress;
  recipientAddress: EvmAddress;
  amount: bigint;
}): Promise<bigint> {
  return await getClient(chainId).estimateTotalFee({
    account: senderAddress,
    to: recipientAddress,
    value: amount,
  });
}

async function estimateERC20FeesForL2({
  chainId,
  contractAddress,
  recipientAddress,
  senderAddress,
  amount,
}: {
  chainId: ChainId;
  contractAddress: EvmAddress;
  senderAddress: EvmAddress;
  recipientAddress: EvmAddress;
  amount: bigint;
}): Promise<bigint> {
  return await getClient(chainId).estimateContractTotalFee({
    address: contractAddress,
    abi: erc20Abi,
    functionName: "transfer",
    account: senderAddress,
    args: [recipientAddress, amount],
  });
}

async function makeERC20ContractCall(
  chainId: ChainId,
  contractAdress: EvmAddress,
  functionName: string,
  args: unknown[] = []
): Promise<unknown | null> {
  const client = getClient(chainId);

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

async function fetchERC20Name(chainId: ChainId, contractAdress: EvmAddress): Promise<string> {
  return (await makeERC20ContractCall(chainId, contractAdress, "name")) as string;
}

async function fetchERC20Decimals(chainId: ChainId, contractAdress: EvmAddress): Promise<number> {
  return (await makeERC20ContractCall(chainId, contractAdress, "decimals")) as number;
}

async function fetchERC20Ticker(chainId: ChainId, contractAdress: EvmAddress): Promise<string> {
  return (await makeERC20ContractCall(chainId, contractAdress, "symbol")) as string;
}

async function fetchERC20Info(chainId: ChainId, contractAddress: EvmAddress): Promise<Token> {
  let [token] = await TokenStore.load(chainId, [contractAddress]);
  if (token !== null) {
    return token;
  }
  const [name, decimals, ticker] = await Promise.all([
    fetchERC20Name(chainId, contractAddress),
    fetchERC20Decimals(chainId, contractAddress),
    fetchERC20Ticker(chainId, contractAddress),
  ]);
  token = {
    type: TokenType.ERC20,
    id: contractAddress,
    name,
    ticker,
    decimals,
    contractAddress,
  };
  await TokenStore.save(chainId, [token]);
  return token;
}

async function fetchERC20Balance({
  chainId,
  contractAddress,
  senderAddress,
}: {
  chainId: ChainId;
  contractAddress: EvmAddress;
  senderAddress: EvmAddress;
}): Promise<bigint> {
  return (await makeERC20ContractCall(chainId, contractAddress, "balanceOf", [senderAddress])) as bigint;
}

async function fetchBalance(chainId: ChainId, address: EvmAddress): Promise<bigint> {
  return await getClient(chainId).getBalance({ address });
}

async function fetchNonce(chainId: ChainId, address: EvmAddress): Promise<number> {
  return await getClient(chainId).getTransactionCount({ address });
}

// TODO: Node implementation for fetching transactions
// async function fetchTransaction(chainId: ChainId, transactionHash: string): Promise<FinalizedTransaction | null> {
//   try {
//     const [basic, receipt] = await Promise.all([
//       getClient(chainId).getTransaction({ hash: transactionHash }),
//       getClient(chainId).getTransactionReceipt({ hash: transactionHash }),
//     ]);
//     return {
//       raw: basic,
//       parsed: {
//         id: basic.hash,
//         mode: TransactionMode.
//       }
//     }
//   } catch {
//     return null;
//   }
// }

async function broadcast(chainId: ChainId, signedTransaction: string) {
  return await getClient(chainId).sendRawTransaction({ serializedTransaction: signedTransaction });
}

export {
  broadcast,
  estimateERC20FeesForL2,
  estimateERC20Gas,
  estimateFeesForL2,
  estimateFeesPerGas,
  estimateGas,
  fetchBalance,
  fetchERC20Balance,
  fetchERC20Info,
  fetchNonce,
};
