import { ChainId } from "~/app/model/types_WIP";
import { EvmAddress, HexString } from "../types";

const ALCHEMY_SUPPORTED_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.ETHEREUM, "eth-mainnet"],
  [ChainId.SEPOLIA, "eth-sepolia"],
  [ChainId.HOLESKY, "eth-holesky"],
  [ChainId.POLYGON, "polygon-mainnet"],
  [ChainId.POLYGON_AMOY, "polygon-amoy"],
  [ChainId.ARBITRUM, "arb-mainnet"],
  [ChainId.ARBITRUM_SEPOLIA, "arb-sepolia"],
  [ChainId.OPTIMISM, "opt-mainnet"],
  [ChainId.OPTIMISM_SEPOLIA, "opt-sepolia"],
  [ChainId.BASE, "base-mainnet"],
  [ChainId.BASE_SEPOLIA, "base-sepolia"],
  [ChainId.BSC, "bnb-mainnet"],
  [ChainId.BSC_TESTNET, "bnb-testnet"],
  [ChainId.LINEA, "linea-mainnet  "],
  [ChainId.LINEA_SEPOLIA, "linea-sepolia"],
  [ChainId.AVALANCHE, "avax-mainnet"],
  [ChainId.AVALANCHE_FUJI, "avax-mainnet"],
  [ChainId.GNOSIS, "gnosis-mainnet"],
  [ChainId.GNOSIS_CHIADO, "gnosis-chiado"],
  [ChainId.MONAD_TESTNET, "monad-testnet"],
  [ChainId.WORLD_CHAIN, "world-chain"],
]);

type AlchemyERC20TokenBalance = {
  contractAddress: EvmAddress;
  tokenBalance: HexString;
};

type AlchemyERC20Token = {
  decimals: number | null;
  logo: string | null;
  name: string;
  symbol: string;
};

type AlchemyJSONRPCError = {
  jsonrpc: "2.0";
  id: number;
  error: {
    code: number;
    message: string;
  };
};

type AlchemyBalanceRequest = {
  address: EvmAddress;
  tokenBalances: AlchemyERC20TokenBalance[];
};

type AlchemyPaginatedRequest<T extends object> = T & {
  pageKey?: string;
};

type AlchemyLog = {
  blockHash: HexString;
  address: EvmAddress;
  logIndex: HexString;
  data: HexString;
  removed: boolean;
  topics: HexString[];
  blockNumber: HexString;
  transactionIndex: HexString;
  transactionHash: HexString;
};

type AlchemyTransaction = {
  blockHash: HexString;
  blockNumber: HexString;
  hash: HexString;
  input: HexString;
  r: HexString;
  s: HexString;
  v: HexString;
  gas: HexString;
  from: HexString;
  transactionIndex: HexString;
  to: HexString;
  type: HexString;
  value: HexString;
  nonce: HexString;
  gasPrice: HexString;
};

type AlchemyTransactionReceipt = {
  transactionHash: HexString;
  blockHash: HexString;
  blockNumber: HexString;
  logsBloom: HexString;
  gasUsed: HexString;
  contractAddress: EvmAddress | null;
  cumulativeGasUsed: HexString;
  transactionIndex: HexString;
  from: EvmAddress;
  to: EvmAddress;
  type: HexString;
  effectiveGasPrice: HexString;
  logs: AlchemyLog[];
  status: HexString;
};

type AlchemyTransactionWithReceipt = AlchemyTransaction & {
  receipt: AlchemyTransactionReceipt;
};

type AlchemyTransfer = {
  blockNum: HexString;
  uniqueId: HexString;
  hash: HexString;
  from: HexString;
  to: HexString;
  value: number;
  erc721TokenId: null; // Ignoring this for now
  erc1155Metadata: null; // Ignoring this for now
  tokenId: null; // Ignoring this for now
  asset: string;
  category: string;
  rawContract: {
    value: HexString;
    address: null;
    decimal: HexString;
  };
  metadata: {
    blockTimestamp: string;
  };
};

type AlchemyBlock = {
  number: HexString;
  hash: HexString;
  transactions: []; // Ignored for now
  totalDifficulty: HexString;
  logsBloom: HexString;
  receiptsRoot: HexString;
  extraData: HexString;
  nonce: HexString;
  miner: HexString;
  difficulty: HexString;
  gasLimit: HexString;
  gasUsed: HexString;
  uncles: [];
  sha3Uncles: HexString;
  size: HexString;
  transactionsRoot: HexString;
  stateRoot: HexString;
  mixHash: HexString;
  parentHash: HexString;
  timestamp: HexString;
};

export { ALCHEMY_SUPPORTED_CHAIN_IDS };
export type {
  AlchemyBalanceRequest,
  AlchemyBlock,
  AlchemyERC20Token,
  AlchemyERC20TokenBalance,
  AlchemyJSONRPCError,
  AlchemyLog,
  AlchemyPaginatedRequest,
  AlchemyTransaction,
  AlchemyTransactionReceipt,
  AlchemyTransactionWithReceipt,
  AlchemyTransfer,
};
