import { ChainId, Chain, ChainParams } from "../model/types_WIP";

const CHAINS: Record<ChainId, Chain<ChainParams>> = {
  algorand: {
    id: ChainId.ALGORAND,
    family: "algorand",
    name: "Algorand",
    ticker: "ALGO",
    decimals: 6,
    backends: {
      nodeURL: "https://mainnet-api.algonode.cloud/v2",
      explorerURL: "https://mainnet-idx.algonode.cloud/v2",
    },
  },
  cosmoshub: {
    id: ChainId.COSMOSHUB,
    family: "cosmos",
    name: "CosmosHub",
    ticker: "ATOM",
    decimals: 6,
    backends: {
      nodeURL: "https://cosmos-rest.publicnode.com",
    },
    params: {
      prefix: "cosmos",
      validatorPrefix: "cosmosvaloper",
      denom: "uatom",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  "cosmoshub-testnet": {
    id: ChainId.COSMOSHUB_TESTNET,
    family: "cosmos",
    name: "CosmosHub Testnet",
    ticker: "ATOM",
    decimals: 6,
    backends: {
      nodeURL: "https://api-t.cosmos.nodestake.top",
    },
    isTestNet: true,
    params: {
      prefix: "cosmos",
      validatorPrefix: "cosmosvaloper",
      denom: "uatom",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  osmosis: {
    id: ChainId.OSMOSIS,
    family: "cosmos",
    name: "Osmosis",
    ticker: "OSMO",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/cos3/rest/b18879ccf0bbb32d82c6c6ee02074f8a",
    },
    params: {
      prefix: "osmo",
      validatorPrefix: "osmovaloper",
      denom: "uosmo",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  ethereum: {
    id: ChainId.ETHEREUM,
    family: "evm",
    name: "Ethereum",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/eth/REDACTED",
      explorerURL: "https://api.etherscan.io/api",
    },
    params: {
      evmChainId: 1,
    },
  },
  sepolia: {
    id: ChainId.SEPOLIA,
    family: "evm",
    name: "Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/sepolia/REDACTED",
      explorerURL: "https://api-sepolia.etherscan.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 11155111,
    },
  },
  holesky: {
    id: ChainId.HOLESKY,
    family: "evm",
    name: "Holesky",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/holesky/REDACTED",
      explorerURL: "https://api-holesky.etherscan.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 17000,
    },
  },
  zksync: {
    id: ChainId.ZKSYNC,
    family: "evm",
    name: "ZkSync",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/zksync/REDACTED",
      explorerURL: "https://zksync.blockscout.com/api",
    },
    params: {
      evmChainId: 324,
    },
  },
  "zksync-sepolia": {
    id: ChainId.ZKSYNC_SEPOLIA,
    family: "evm",
    name: "ZkSync Testnet",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/zksync-sepolia/REDACTED",
      explorerURL: "https://zksync.blockscout.com/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 300,
    },
  },
  "injective-testnet": {
    id: ChainId.INJECTIVE_TESTNET,
    family: "evm",
    name: "Injective",
    ticker: "INJ",
    decimals: 18,
    backends: {
      nodeURL: "https://testnet.rpc.inevm.com/http",
      //explorerURL: TODO,
    },
    isTestNet: true,
    params: {
      evmChainId: 2424,
    },
  },
  base: {
    id: ChainId.BASE,
    family: "evm",
    name: "Base",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/base/REDACTED",
      explorerURL: "https://api.basescan.org/api",
    },
    params: {
      evmChainId: 8453,
      isL2Fees: true,
    },
  },
  "base-sepolia": {
    id: ChainId.BASE_SEPOLIA,
    family: "evm",
    name: "Base Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/base-sepolia/REDACTED",
      explorerURL: "https://api.basescan.org/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 84532,
      isL2Fees: true,
    },
  },
  optimism: {
    id: ChainId.OPTIMISM,
    family: "evm",
    name: "Optimism",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/optimism/REDACTED",
      explorerURL: "https://api-optimistic.etherscan.io/api",
    },
    params: {
      evmChainId: 10,
      isL2Fees: true,
    },
  },
  "optimism-sepolia": {
    id: ChainId.OPTIMISM_SEPOLIA,
    family: "evm",
    name: "Optimism Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/optimism-sepolia/REDACTED",
      explorerURL: "https://api-sepolia-optimistic.etherscan.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 11155420,
      isL2Fees: true,
    },
  },
  arbitrum: {
    id: ChainId.ARBITRUM,
    family: "evm",
    name: "Arbitrum One",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/arbitrum/REDACTED",
      explorerURL: "https://api.arbiscan.io/api",
    },
    params: {
      evmChainId: 42161,
    },
  },
  "arbitrum-sepolia": {
    id: ChainId.ARBITRUM_SEPOLIA,
    family: "evm",
    name: "Arbitrum Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/arbitrum-sepolia/REDACTED",
      explorerURL: "https://api-sepolia.arbiscan.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 421614,
    },
  },
  polygon: {
    id: ChainId.POLYGON,
    family: "evm",
    name: "Polygon",
    ticker: "MATIC",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/polygon/REDACTED",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 137,
    },
  },
  "polygon-amoy": {
    id: ChainId.POLYGON_AMOY,
    family: "evm",
    name: "Polygon Amoy",
    ticker: "MATIC",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/amoy/REDACTED",
      //TODO explorerURL: "",
    },
    isTestNet: true,
    params: {
      evmChainId: 80002,
    },
  },
  "bsc": {
    id: ChainId.BSC,
    family: "evm",
    name: "Binance Smart Chain",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc/REDACTED",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 56,
    },
  },
  "bsc-testnet": {
    id: ChainId.BSC_TESTNET,
    family: "evm",
    name: "Binance Smart Chain Testnet",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc-testnet/REDACTED",
      //TODO explorerURL: "",
    },
    isTestNet: true,
    params: {
      evmChainId: 97,
    },
  },
  "linea": {
    id: ChainId.LINEA,
    family: "evm",
    name: "Linea",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/linea/REDACTED",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 59144,
    },
  },
  "linea-sepolia": {
    id: ChainId.LINEA_SEPOLIA,
    family: "evm",
    name: "Linea Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/linea-sepolia/REDACTED",
      //TODO explorerURL: "",
    },
    isTestNet: true,
    params: {
      evmChainId: 59141,
    },
  },
  "avalanche": {
    id: ChainId.AVALANCHE,
    family: "evm",
    name: "Avalanche",
    ticker: "AVAX",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/avalanche/REDACTED",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 43114,
    },
  },
  "gnosis": {
    id: ChainId.GNOSIS,
    family: "evm",
    name: "Gnosis",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis/REDACTED",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 100,
    },
  },
  "gnosis-chiado": {
    id: ChainId.GNOSIS_CHIADO,
    family: "evm",
    name: "Gnosis Chiado",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis-testnet/REDACTED",
      //TODO explorerURL: "",
    },
    isTestNet: true,
    params: {
      evmChainId: 10200,
    },
  },
};

export { CHAINS };
