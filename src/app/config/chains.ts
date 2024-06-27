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
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/osmosis/rest/REDACTED",
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
  "osmosis-testnet": {
    id: ChainId.OSMOSIS_TESTNET,
    family: ChainFamily.COSMOS,
    name: "Osmosis Testnet",
    ticker: "OSMO",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/osmosist/rest/REDACTED",
    },
    isTestNet: true,
    params: {
      prefix: "osmo",
      validatorPrefix: "osmovaloper",
      denom: "uosmo",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  celestia: {
    id: ChainId.CELESTIA,
    family: ChainFamily.COSMOS,
    name: "Celestia",
    ticker: "TIA",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/celestia/rest/REDACTED",
    },
    params: {
      prefix: "celestia",
      validatorPrefix: "celestiavaloper",
      denom: "utia",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  "celestia-testnet": {
    id: ChainId.CELESTIA_TESTNET,
    family: ChainFamily.COSMOS,
    name: "Celestia Testnet",
    ticker: "TIA",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/celestiatm/rest/REDACTED",
    },
    params: {
      prefix: "celestia",
      validatorPrefix: "celestiavaloper",
      denom: "utia",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  dydx: {
    id: ChainId.DYDX,
    family: ChainFamily.COSMOS,
    name: "dYdX",
    ticker: "DYDX",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/celestiatm/rest/REDACTED",
    },
    params: {
      prefix: "celestia",
      validatorPrefix: "celestiavaloper",
      denom: "adydx",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  "dydx-testnet": {
    id: ChainId.DYDX_TESTNET,
    family: ChainFamily.COSMOS,
    name: "dYdX",
    ticker: "TIA",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/celestiatm/rest/REDACTED",
    },
    params: {
      prefix: "celestia",
      validatorPrefix: "celestiavaloper",
      denom: "utia",
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
      nodeURL: "https://site1.moralis-nodes.com/eth/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/sepolia/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/holesky/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/zksync/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/zksync-sepolia/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/base/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/base-sepolia/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/optimism/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/optimism-sepolia/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/arbitrum/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/arbitrum-sepolia/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/polygon/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/amoy/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/bsc/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/bsc-testnet/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/linea/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/linea-sepolia/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/avalanche/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/gnosis/REDACTED",
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
      nodeURL: "https://site1.moralis-nodes.com/gnosis-testnet/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 10200,
    },
  },
  moonbeam: {
    id: ChainId.MOONBEAM,
    family: ChainFamily.EVM,
    name: "Moonbeam",
    ticker: "GLMR",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonbeam/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 1284,
    },
  },
  moonriver: {
    id: ChainId.MOONRIVER,
    family: ChainFamily.EVM,
    name: "Moonriver",
    ticker: "MOVR",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonriver/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      evmChainId: 1285,
    },
  },
  moonbase: {
    id: ChainId.MOONBASE,
    family: ChainFamily.EVM,
    name: "Moonbase",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonbase/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      evmChainId: 1287,
    },
  },
  fantom: {
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
  palm: {
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
  },
};

// FIXME Trick to filter-out private 'backends' field from response
// Needs to be handled with DTO instead
// https://adamik.atlassian.net/browse/ADV-13
const CHAINS_PUBLIC = Object.fromEntries(
  Object.entries(CHAINS).map(([key, value]) => {
    const { backends, ...rest } = value;
    return [key, rest];
  })
);

export { CHAINS, CHAINS_PUBLIC };
