import { ChainId, Chain, ChainParams, ChainFamily } from "../model/types_WIP";

const CHAINS: Record<ChainId, Chain<ChainParams>> = {
  algorand: {
    id: ChainId.ALGORAND,
    family: ChainFamily.ALGORAND,
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
    family: ChainFamily.COSMOS,
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
    family: ChainFamily.COSMOS,
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
    family: ChainFamily.COSMOS,
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
    family: ChainFamily.EVM,
    name: "Ethereum",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://ethereum-rpc.publicnode.com",
      nodeURL: "https://site1.moralis-nodes.com/eth/edd8151f3c634ee2a808f34c47c7ad70",
      //explorerURL: "https://api.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 1,
    },
  },
  sepolia: {
    id: ChainId.SEPOLIA,
    family: ChainFamily.EVM,
    name: "Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://ethereum-sepolia-rpc.publicnode.com",
      nodeURL: "https://site1.moralis-nodes.com/sepolia/fe0cd204d0324cae84cb27769d5ab205",
      //explorerURL: "https://api-sepolia.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 11155111,
    },
  },
  holesky: {
    id: ChainId.HOLESKY,
    family: ChainFamily.EVM,
    name: "Holesky",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://ethereum-holesky-rpc.publicnode.com",
      nodeURL: "https://site1.moralis-nodes.com/holesky/59fb652c988245799984ee5b4ff8c065",
      //explorerURL: "https://api-holesky.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 17000,
    },
  },
  zksync: {
    id: ChainId.ZKSYNC,
    family: ChainFamily.EVM,
    name: "ZkSync",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://zksync-mainnet.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      nodeURL: "https://site1.moralis-nodes.com/zksync/547c7bd4d8e24c62ae1f059e634b06ae",
      //explorerURL: "https://zksync.blockscout.com/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 324,
    },
  },
  "zksync-sepolia": {
    id: ChainId.ZKSYNC_SEPOLIA,
    family: ChainFamily.EVM,
    name: "ZkSync Testnet",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://zksync-sepolia.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      nodeURL: "https://site1.moralis-nodes.com/zksync-sepolia/a55bf0a6af264a73b083323f58a5d50b",
      //explorerURL: "https://zksync.blockscout.com/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 300,
    },
  },
  "injective-testnet": {
    id: ChainId.INJECTIVE_TESTNET,
    family: ChainFamily.EVM,
    name: "Injective",
    ticker: "INJ",
    decimals: 18,
    backends: {
      nodeURL: "https://testnet.rpc.inevm.com/http",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 2424,
    },
  },
  base: {
    id: ChainId.BASE,
    family: ChainFamily.EVM,
    name: "Base",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://base-mainnet.g.alchemy.com/v2/rOq_ClcjzdlIKQh-h6sMTBW9MhVBf94Z",
      nodeURL: "https://site1.moralis-nodes.com/base/9b6b18e784a54e03a0587a4b14c3c8c5",
      //explorerURL: "https://api.basescan.org/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 8453,
      isL2Fees: true,
    },
  },
  "base-sepolia": {
    id: ChainId.BASE_SEPOLIA,
    family: ChainFamily.EVM,
    name: "Base Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://sepolia.base.org",
      nodeURL: "https://site1.moralis-nodes.com/base-sepolia/55c79b8e9fbb41da84c53550ada7b1fb",
      //explorerURL: "https://api.basescan.org/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 84532,
      isL2Fees: true,
    },
  },
  optimism: {
    id: ChainId.OPTIMISM,
    family: ChainFamily.EVM,
    name: "Optimism",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://opt-mainnet.g.alchemy.com/v2/pDuVOEX6OCaN6lq_xILoecc3lcFXuyTz",
      nodeURL: "https://site1.moralis-nodes.com/optimism/f6e1593c1f3a4213811a1bae65bf4203",
      //explorerURL: "https://api-optimistic.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 10,
      isL2Fees: true,
    },
  },
  "optimism-sepolia": {
    id: ChainId.OPTIMISM_SEPOLIA,
    family: ChainFamily.EVM,
    name: "Optimism Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://opt-sepolia.g.alchemy.com/v2/6dtfsgvoSwhyPVqp0_nvAWJ40CbiOqQ8",
      nodeURL: "https://site1.moralis-nodes.com/optimism-sepolia/e76f53f4949641a2b9c87571b7e03e87",
      //explorerURL: "https://api-sepolia-optimistic.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 11155420,
      isL2Fees: true,
    },
  },
  arbitrum: {
    id: ChainId.ARBITRUM,
    family: ChainFamily.EVM,
    name: "Arbitrum One",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://arbitrum-one.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      nodeURL: "https://site1.moralis-nodes.com/arbitrum/98b1253e6794472db0999b44363fdb9c",
      //explorerURL: "https://api.arbiscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 42161,
    },
  },
  "arbitrum-sepolia": {
    id: ChainId.ARBITRUM_SEPOLIA,
    family: ChainFamily.EVM,
    name: "Arbitrum Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://arbitrum-sepolia.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      nodeURL: "https://site1.moralis-nodes.com/arbitrum-sepolia/50db3911bb294983a8701b9c0930d80c",
      //explorerURL: "https://api-sepolia.arbiscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 421614,
    },
  },
  polygon: {
    id: ChainId.POLYGON,
    family: ChainFamily.EVM,
    name: "Polygon",
    ticker: "MATIC",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/polygon/70eb3a5858dc4f0d8ca0e1a1cf8d375f",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 137,
    },
  },
  "polygon-amoy": {
    id: ChainId.POLYGON_AMOY,
    family: ChainFamily.EVM,
    name: "Polygon Amoy",
    ticker: "MATIC",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/amoy/7a1ffbef35b1400b80a3d8735f637bb3",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 80002,
    },
  },
  bsc: {
    id: ChainId.BSC,
    family: ChainFamily.EVM,
    name: "Binance Smart Chain",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc/7c7d3520352d4cf1bba5535ed015851b",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 56,
    },
  },
  "bsc-testnet": {
    id: ChainId.BSC_TESTNET,
    family: ChainFamily.EVM,
    name: "Binance Smart Chain Testnet",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc-testnet/8d515e6b213f4e02afc42966422eca11",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 97,
    },
  },
  linea: {
    id: ChainId.LINEA,
    family: ChainFamily.EVM,
    name: "Linea",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/linea/38da1be47d6a45d5aee7e557800e9248",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 59144,
    },
  },
  "linea-sepolia": {
    id: ChainId.LINEA_SEPOLIA,
    family: ChainFamily.EVM,
    name: "Linea Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/linea-sepolia/03ccfd8ae2ec4c75832ade4cc74b2de5",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 59141,
    },
  },
  avalanche: {
    id: ChainId.AVALANCHE,
    family: ChainFamily.EVM,
    name: "Avalanche",
    ticker: "AVAX",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/avalanche/5addb0088d03429eb061d98a104649ab",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 43114,
    },
  },
  gnosis: {
    id: ChainId.GNOSIS,
    family: ChainFamily.EVM,
    name: "Gnosis",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis/87598d6b313843f6be61fecc9b874cdd",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 100,
    },
  },
  "gnosis-chiado": {
    id: ChainId.GNOSIS_CHIADO,
    family: ChainFamily.EVM,
    name: "Gnosis Chiado",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis-testnet/91e2e32f95864e6891fbe76dc97e57cb",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 10200,
    },
  },
  "moonbeam": {
    id: ChainId.MOONBEAM,
    family: ChainFamily.EVM,
    name: "Moonbeam",
    ticker: "GLMR",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonbeam/82196cbf24574538b48c18bb13ffda21",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 1284,
    },
  },
  "moonriver": {
    id: ChainId.MOONRIVER,
    family: ChainFamily.EVM,
    name: "Moonriver",
    ticker: "MOVR",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonriver/84a61f509f5e4ae3a9c29ebd7e8fda67",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 1285,
    },
  },
  "moonbase": {
    id: ChainId.MOONBASE,
    family: ChainFamily.EVM,
    name: "Moonbase",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonbase/a4078cfc56ad43d5a5aa557241ddb7bb",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 1287,
    },
  },
  "fantom": {
    id: ChainId.FANTOM,
    family: ChainFamily.EVM,
    name: "Fantom",
    ticker: "FTM",
    decimals: 18,
    backends: {
      nodeURL: "https://rpcapi.fantom.network",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 250,
    },
  },
  "palm": {
    id: ChainId.PALM,
    family: ChainFamily.EVM,
    name: "Palm ",
    ticker: "PALM",
    decimals: 18,
    backends: {
      nodeURL: "https://palm-mainnet.infura.io/v3/3a961d6501e54add9a41aa53f15de99b",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 11297108109,
    },
  }
};

export { CHAINS };
