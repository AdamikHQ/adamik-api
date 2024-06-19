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
      nodeURL: "https://site1.moralis-nodes.com/eth/edd8151f3c634ee2a808f34c47c7ad70",
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
      nodeURL: "https://site1.moralis-nodes.com/sepolia/fe0cd204d0324cae84cb27769d5ab205",
      explorerURL: "https://api-sepolia.etherscan.io/api",
    },
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
      nodeURL: "https://site1.moralis-nodes.com/holesky/59fb652c988245799984ee5b4ff8c065",
      explorerURL: "https://api-holesky.etherscan.io/api",
    },
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
      nodeURL: "https://site1.moralis-nodes.com/zksync/547c7bd4d8e24c62ae1f059e634b06ae",
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
      nodeURL: "https://site1.moralis-nodes.com/zksync-sepolia/a55bf0a6af264a73b083323f58a5d50b",
      explorerURL: "https://zksync.blockscout.com/api",
    },
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
      nodeURL: "https://site1.moralis-nodes.com/base/9b6b18e784a54e03a0587a4b14c3c8c5",
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
      nodeURL: "https://site1.moralis-nodes.com/base-sepolia/55c79b8e9fbb41da84c53550ada7b1fb",
      explorerURL: "https://api.basescan.org/api",
    },
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
      nodeURL: "https://site1.moralis-nodes.com/optimism/f6e1593c1f3a4213811a1bae65bf4203",
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
      nodeURL: "https://site1.moralis-nodes.com/optimism-sepolia/e76f53f4949641a2b9c87571b7e03e87",
      explorerURL: "https://api-sepolia-optimistic.etherscan.io/api",
    },
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
      nodeURL: "https://site1.moralis-nodes.com/arbitrum/98b1253e6794472db0999b44363fdb9c",
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
      nodeURL: "https://site1.moralis-nodes.com/arbitrum-sepolia/50db3911bb294983a8701b9c0930d80c",
      explorerURL: "https://api-sepolia.arbiscan.io/api",
    },
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
      nodeURL: "https://site1.moralis-nodes.com/polygon/70eb3a5858dc4f0d8ca0e1a1cf8d375f",
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
      nodeURL: "https://site1.moralis-nodes.com/amoy/7a1ffbef35b1400b80a3d8735f637bb3",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 80002,
    },
  },
  "binance-smart-chain": {
    id: ChainId.BSC,
    family: "evm",
    name: "Binance Smart Chain",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc/7c7d3520352d4cf1bba5535ed015851b",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 56,
    },
  },
  "binance-smart-chain-testnet": {
    id: ChainId.BSC_TESTNET,
    family: "evm",
    name: "Binance Smart Chain Testnet",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc-testnet/8d515e6b213f4e02afc42966422eca11",
      //TODO explorerURL: "",
    },
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
      nodeURL: "https://site1.moralis-nodes.com/linea/38da1be47d6a45d5aee7e557800e9248",
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
      nodeURL: "https://site1.moralis-nodes.com/linea-sepolia/03ccfd8ae2ec4c75832ade4cc74b2de5",
      //TODO explorerURL: "",
    },
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
      nodeURL: "https://site1.moralis-nodes.com/avalanche/5addb0088d03429eb061d98a104649ab",
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
      nodeURL: "https://site1.moralis-nodes.com/gnosis/87598d6b313843f6be61fecc9b874cdd",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 100,
    },
  },
  "gnosis-testnet": {
    id: ChainId.GNOSIS_TESTNET,
    family: "evm",
    name: "Gnosis Chiado",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis-testnet/91e2e32f95864e6891fbe76dc97e57cb",
      //TODO explorerURL: "",
    },
    params: {
      evmChainId: 10200,
    },
  },
};

export { CHAINS };
