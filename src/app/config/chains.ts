import { BITCOIN_SIGNET_FEATURES } from "../families/bitcoin/features";
import { Chain, ChainFamily, ChainId, ProviderType, TransactionMode } from "../model/types_WIP";
import {
  ALGORAND_FEATURES,
  BITCOIN_FEATURES,
  COSMOS_FEATURES,
  EVM_FEATURES,
  EVM_ROOTSTOCK_FEATURES,
  NATIVE_READ_WRITE_ONLY,
  STARKNET_FEATURES,
  TON_FEATURES,
  TRON_FEATURES,
} from "./features";
import { getSignerSpecForChain } from "./signers";

const CHAINS: { [key in ChainId]: Chain } = {
  algorand: {
    family: ChainFamily.ALGORAND,
    id: ChainId.ALGORAND,
    nativeId: "algorand",
    name: "Algorand",
    ticker: "ALGO",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://mainnet-api.algonode.cloud/v2",
      },
      {
        type: ProviderType.algoindexer,
        url: "https://mainnet-idx.algonode.cloud/v2",
      },
    ],
    supportedFeatures: ALGORAND_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.ALGORAND, ChainFamily.ALGORAND),
  },
  cosmoshub: {
    family: ChainFamily.COSMOS,
    id: ChainId.COSMOSHUB,
    nativeId: "cosmoshub-4",
    name: "CosmosHub",
    ticker: "ATOM",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-cosmos.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "cosmos",
      validatorPrefix: "cosmosvaloper",
      denom: "uatom",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.COSMOSHUB),
    signerSpec: getSignerSpecForChain(ChainId.COSMOSHUB, ChainFamily.COSMOS),
  },
  "cosmoshub-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.COSMOSHUB_TESTNET,
    nativeId: "theta-testnet-001",
    name: "CosmosHub Testnet",
    ticker: "ATOM",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://api-t.cosmos.nodestake.top",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    isTestnetFor: ChainId.COSMOSHUB,
    params: {
      prefix: "cosmos",
      validatorPrefix: "cosmosvaloper",
      denom: "uatom",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.COSMOSHUB_TESTNET),
    signerSpec: getSignerSpecForChain(ChainId.COSMOSHUB_TESTNET, ChainFamily.COSMOS),
  },
  osmosis: {
    family: ChainFamily.COSMOS,
    id: ChainId.OSMOSIS,
    nativeId: "osmosis-1",
    name: "Osmosis",
    ticker: "OSMO",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-osmosis.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "osmo",
      validatorPrefix: "osmovaloper",
      denom: "uosmo",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.OSMOSIS),
    signerSpec: getSignerSpecForChain(ChainId.OSMOSIS, ChainFamily.COSMOS),
  },
  "osmosis-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.OSMOSIS_TESTNET,
    nativeId: "osmo-test-5",
    name: "Osmosis Testnet",
    ticker: "OSMO",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://g.w.lavanet.xyz/gateway/osmosist/rest/bfdb617358bd786c30374c8799978c27",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    isTestnetFor: ChainId.OSMOSIS,
    params: {
      prefix: "osmo",
      validatorPrefix: "osmovaloper",
      denom: "uosmo",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.OSMOSIS_TESTNET),
    signerSpec: getSignerSpecForChain(ChainId.OSMOSIS_TESTNET, ChainFamily.COSMOS),
  },
  celestia: {
    family: ChainFamily.COSMOS,
    id: ChainId.CELESTIA,
    nativeId: "celestia",
    name: "Celestia",
    ticker: "TIA",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-celestia.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "celestia",
      validatorPrefix: "celestiavaloper",
      denom: "utia",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.02,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.CELESTIA),
    signerSpec: getSignerSpecForChain(ChainId.CELESTIA, ChainFamily.COSMOS),
  },
  "celestia-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.CELESTIA_TESTNET,
    nativeId: "mocha-4",
    name: "Celestia Testnet",
    ticker: "TIA",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://g.w.lavanet.xyz/gateway/celestiatm/rest/bfdb617358bd786c30374c8799978c27",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    isTestnetFor: ChainId.CELESTIA,
    params: {
      prefix: "celestia",
      validatorPrefix: "celestiavaloper",
      denom: "utia",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.02,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.CELESTIA_TESTNET),
    signerSpec: getSignerSpecForChain(ChainId.CELESTIA_TESTNET, ChainFamily.COSMOS),
  },
  dydx: {
    family: ChainFamily.COSMOS,
    id: ChainId.DYDX,
    nativeId: "dydx-mainnet-1",
    name: "dYdX Protocol",
    ticker: "DYDX",
    decimals: 18,
    providers: [
      {
        // (configs can be checked with [nodeURL]/cosmos/base/node/v1beta1/config )
        type: ProviderType.node,
        url: "https://lcd-dydx.imperator.co", // Used to only accepts fees in IBC token USDC, but seems fixed now...
        //url: "https://dydx-rest.publicnode.com", // Works but public node with no guarantee of performance
        //url: "https://dydx-dao-api.polkachu.com", // Same as Ledger Live, but we've been blacklisted...
        //url: "https://community.nuxian-node.ch:6797/dydx/crpc", // Demands twice the standard minimum gas fees, for some reason
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "dydx",
      validatorPrefix: "dydxvaloper",
      denom: "adydx",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 12500000000,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.DYDX),
    signerSpec: getSignerSpecForChain(ChainId.DYDX, ChainFamily.COSMOS),
  },
  axelar: {
    family: ChainFamily.COSMOS,
    id: ChainId.AXELAR,
    nativeId: "axelar-dojo-1",
    name: "Axelar",
    ticker: "AXL",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-axelar.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "axelar",
      validatorPrefix: "axelarvaloper",
      denom: "uaxl",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.007,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.AXELAR),
    signerSpec: getSignerSpecForChain(ChainId.AXELAR, ChainFamily.COSMOS),
  },
  ethereum: {
    family: ChainFamily.EVM,
    id: ChainId.ETHEREUM,
    nativeId: "1",
    name: "Ethereum",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/eth/edd8151f3c634ee2a808f34c47c7ad70",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
      {
        type: ProviderType.alchemy,
        url: "https://eth-mainnet.g.alchemy.com/v2/0k8SiAAwbukxESqUwUHjgdMlabpyUd1g",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.ETHEREUM),
    signerSpec: getSignerSpecForChain(ChainId.ETHEREUM, ChainFamily.EVM),
  },
  sepolia: {
    family: ChainFamily.EVM,
    id: ChainId.SEPOLIA,
    nativeId: "11155111",
    name: "Sepolia",
    ticker: "ETH",
    decimals: 18,
    isTestnetFor: ChainId.ETHEREUM,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/sepolia/fe0cd204d0324cae84cb27769d5ab205",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.SEPOLIA),
    signerSpec: getSignerSpecForChain(ChainId.SEPOLIA, ChainFamily.EVM),
  },
  holesky: {
    family: ChainFamily.EVM,
    id: ChainId.HOLESKY,
    nativeId: "17000",
    name: "Holesky",
    ticker: "ETH",
    decimals: 18,
    isTestnetFor: ChainId.ETHEREUM,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/holesky/59fb652c988245799984ee5b4ff8c065",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.HOLESKY),
    signerSpec: getSignerSpecForChain(ChainId.HOLESKY, ChainFamily.EVM),
  },
  zksync: {
    family: ChainFamily.EVM,
    id: ChainId.ZKSYNC,
    nativeId: "324",
    name: "zkSync",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/zksync/547c7bd4d8e24c62ae1f059e634b06ae",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.ZKSYNC),
    signerSpec: getSignerSpecForChain(ChainId.ZKSYNC, ChainFamily.EVM),
  },
  "zksync-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.ZKSYNC_SEPOLIA,
    nativeId: "300",
    name: "ZkSync Testnet",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/zksync-sepolia/a55bf0a6af264a73b083323f58a5d50b",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.ZKSYNC,
    supportedFeatures: EVM_FEATURES(ChainId.ZKSYNC_SEPOLIA),
    signerSpec: getSignerSpecForChain(ChainId.ZKSYNC_SEPOLIA, ChainFamily.EVM),
  },
  "injective-evm-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.INJECTIVE_EVM_TESTNET,
    nativeId: "2424",
    name: "Injective Evm Testnet",
    ticker: "INJ",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://testnet.rpc.inevm.com/http",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: "injective-evm", // TODO Support the mainnet
    supportedFeatures: EVM_FEATURES(ChainId.INJECTIVE_EVM_TESTNET),
    signerSpec: getSignerSpecForChain(ChainId.INJECTIVE_EVM_TESTNET, ChainFamily.EVM),
  },
  base: {
    family: ChainFamily.EVM,
    id: ChainId.BASE,
    nativeId: "8453",
    name: "Base",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/base/9b6b18e784a54e03a0587a4b14c3c8c5",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    params: {
      isL2Fees: true,
    },
    supportedFeatures: EVM_FEATURES(ChainId.BASE),
    signerSpec: getSignerSpecForChain(ChainId.BASE, ChainFamily.EVM),
  },
  "base-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.BASE_SEPOLIA,
    nativeId: "84532",
    name: "Base Sepolia",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/base-sepolia/55c79b8e9fbb41da84c53550ada7b1fb",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.BASE,
    params: {
      isL2Fees: true,
    },
    supportedFeatures: EVM_FEATURES(ChainId.BASE_SEPOLIA),
    signerSpec: getSignerSpecForChain(ChainId.BASE_SEPOLIA, ChainFamily.EVM),
  },
  optimism: {
    family: ChainFamily.EVM,
    id: ChainId.OPTIMISM,
    nativeId: "10",
    name: "Optimism",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/optimism/f6e1593c1f3a4213811a1bae65bf4203",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    params: {
      isL2Fees: true,
    },
    supportedFeatures: EVM_FEATURES(ChainId.OPTIMISM),
    signerSpec: getSignerSpecForChain(ChainId.OPTIMISM, ChainFamily.EVM),
  },
  "optimism-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.OPTIMISM_SEPOLIA,
    nativeId: "11155420",
    name: "Optimism Sepolia",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/optimism-sepolia/e76f53f4949641a2b9c87571b7e03e87",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.OPTIMISM,
    params: {
      isL2Fees: true,
    },
    supportedFeatures: EVM_FEATURES(ChainId.OPTIMISM_SEPOLIA),
    signerSpec: getSignerSpecForChain(ChainId.OPTIMISM_SEPOLIA, ChainFamily.EVM),
  },
  arbitrum: {
    family: ChainFamily.EVM,
    id: ChainId.ARBITRUM,
    nativeId: "42161",
    name: "Arbitrum One",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/arbitrum/98b1253e6794472db0999b44363fdb9c",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.ARBITRUM),
    signerSpec: getSignerSpecForChain(ChainId.ARBITRUM, ChainFamily.EVM),
  },
  "arbitrum-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.ARBITRUM_SEPOLIA,
    nativeId: "421614",
    name: "Arbitrum Sepolia",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/arbitrum-sepolia/50db3911bb294983a8701b9c0930d80c",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.ARBITRUM,
    supportedFeatures: EVM_FEATURES(ChainId.ARBITRUM_SEPOLIA),
    signerSpec: getSignerSpecForChain(ChainId.ARBITRUM_SEPOLIA, ChainFamily.EVM),
  },
  [ChainId.BITCOIN]: {
    id: ChainId.BITCOIN,
    name: "Bitcoin",
    family: ChainFamily.BITCOIN,
    ticker: "BTC",
    decimals: 8,
    providers: [
      {
        type: ProviderType.blockchair,
        url: "https://api.blockchair.com/bitcoin",
      },
    ],
    params: {
      confirmations: 6,
    },
    nativeId: "bitcoin",
    supportedFeatures: BITCOIN_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.BITCOIN, ChainFamily.BITCOIN),
  },
  [ChainId.BITCOIN_TESTNET]: {
    id: ChainId.BITCOIN_TESTNET,
    nativeId: "bitcoin-testnet",
    name: "Bitcoin Testnet",
    family: ChainFamily.BITCOIN,
    ticker: "BTC",
    decimals: 8,
    providers: [
      {
        type: ProviderType.blockchair,
        url: "https://api.blockchair.com/bitcoin/testnet",
      },
    ],
    isTestnetFor: ChainId.BITCOIN,
    params: {
      confirmations: 6,
    },
    supportedFeatures: BITCOIN_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.BITCOIN_TESTNET, ChainFamily.BITCOIN),
  },
  "bitcoin-signet": {
    id: ChainId.BITCOIN_SIGNET,
    nativeId: "bitcoin-signet",
    name: "Bitcoin Signet",
    family: ChainFamily.BITCOIN,
    ticker: "sBTC",
    decimals: 8,
    providers: [
      {
        type: ProviderType.mempoolspace,
        url: "https://mempool.space/signet/api",
      },
    ],
    isTestnetFor: ChainId.BITCOIN,
    params: {
      confirmations: 6,
    },
    supportedFeatures: BITCOIN_SIGNET_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.BITCOIN_SIGNET, ChainFamily.BITCOIN),
  },
  polygon: {
    family: ChainFamily.EVM,
    id: ChainId.POLYGON,
    nativeId: "137",
    name: "Polygon",
    ticker: "POL",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/polygon/70eb3a5858dc4f0d8ca0e1a1cf8d375f",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.POLYGON),
    signerSpec: getSignerSpecForChain(ChainId.POLYGON, ChainFamily.EVM),
  },
  "polygon-amoy": {
    family: ChainFamily.EVM,
    id: ChainId.POLYGON_AMOY,
    nativeId: "80002",
    name: "Polygon Amoy",
    ticker: "MATIC",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/amoy/7a1ffbef35b1400b80a3d8735f637bb3",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.POLYGON,
    supportedFeatures: EVM_FEATURES(ChainId.POLYGON_AMOY),
    signerSpec: getSignerSpecForChain(ChainId.POLYGON_AMOY, ChainFamily.EVM),
  },
  bsc: {
    family: ChainFamily.EVM,
    id: ChainId.BSC,
    nativeId: "56",
    name: "Binance Smart Chain",
    ticker: "BNB",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/bsc/7c7d3520352d4cf1bba5535ed015851b",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.BSC),
    signerSpec: getSignerSpecForChain(ChainId.BSC, ChainFamily.EVM),
  },
  "bsc-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.BSC_TESTNET,
    nativeId: "97",
    name: "Binance Smart Chain Testnet",
    ticker: "BNB",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/bsc-testnet/8d515e6b213f4e02afc42966422eca11",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.BSC,
    supportedFeatures: EVM_FEATURES(ChainId.BSC_TESTNET),
    signerSpec: getSignerSpecForChain(ChainId.BSC_TESTNET, ChainFamily.EVM),
  },
  linea: {
    family: ChainFamily.EVM,
    id: ChainId.LINEA,
    nativeId: "59144",
    name: "Linea",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/linea/38da1be47d6a45d5aee7e557800e9248",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.LINEA),
    signerSpec: getSignerSpecForChain(ChainId.LINEA, ChainFamily.EVM),
  },
  "linea-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.LINEA_SEPOLIA,
    nativeId: "59141",
    name: "Linea Sepolia",
    ticker: "ETH",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/linea-sepolia/03ccfd8ae2ec4c75832ade4cc74b2de5",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.LINEA,
    supportedFeatures: EVM_FEATURES(ChainId.LINEA_SEPOLIA),
    signerSpec: getSignerSpecForChain(ChainId.LINEA_SEPOLIA, ChainFamily.EVM),
  },
  avalanche: {
    family: ChainFamily.EVM,
    id: ChainId.AVALANCHE,
    nativeId: "43114",
    name: "Avalanche",
    ticker: "AVAX",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/avalanche/5addb0088d03429eb061d98a104649ab",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.AVALANCHE),
    signerSpec: getSignerSpecForChain(ChainId.AVALANCHE, ChainFamily.EVM),
  },
  "avalanche-fuji": {
    family: ChainFamily.EVM,
    id: ChainId.AVALANCHE_FUJI,
    nativeId: "43113",
    name: "Avalanche Fuji Testnet",
    ticker: "AVAX",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://avalanche-fuji-c-chain-rpc.publicnode.com",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.AVALANCHE,
    supportedFeatures: EVM_FEATURES(ChainId.AVALANCHE_FUJI),
    signerSpec: getSignerSpecForChain(ChainId.AVALANCHE_FUJI, ChainFamily.EVM),
  },
  gnosis: {
    family: ChainFamily.EVM,
    id: ChainId.GNOSIS,
    nativeId: "100",
    name: "Gnosis",
    ticker: "xDAI",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/gnosis/87598d6b313843f6be61fecc9b874cdd",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.GNOSIS),
    signerSpec: getSignerSpecForChain(ChainId.GNOSIS, ChainFamily.EVM),
  },
  "gnosis-chiado": {
    family: ChainFamily.EVM,
    id: ChainId.GNOSIS_CHIADO,
    nativeId: "10200",
    name: "Gnosis Chiado",
    ticker: "xDAI",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/gnosis-testnet/91e2e32f95864e6891fbe76dc97e57cb",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.GNOSIS,
    supportedFeatures: EVM_FEATURES(ChainId.GNOSIS_CHIADO),
    signerSpec: getSignerSpecForChain(ChainId.GNOSIS_CHIADO, ChainFamily.EVM),
  },
  moonbeam: {
    family: ChainFamily.EVM,
    id: ChainId.MOONBEAM,
    nativeId: "1284",
    name: "Moonbeam",
    ticker: "GLMR",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/moonbeam/82196cbf24574538b48c18bb13ffda21",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.MOONBEAM),
    signerSpec: getSignerSpecForChain(ChainId.MOONBEAM, ChainFamily.EVM),
  },
  moonriver: {
    family: ChainFamily.EVM,
    id: ChainId.MOONRIVER,
    nativeId: "1285",
    name: "Moonriver",
    ticker: "MOVR",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/moonriver/84a61f509f5e4ae3a9c29ebd7e8fda67",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.MOONRIVER),
    signerSpec: getSignerSpecForChain(ChainId.MOONRIVER, ChainFamily.EVM),
  },
  moonbase: {
    family: ChainFamily.EVM,
    id: ChainId.MOONBASE,
    nativeId: "1287",
    name: "Moonbase",
    ticker: "DEV",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/moonbase/a4078cfc56ad43d5a5aa557241ddb7bb",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.MOONBEAM,
    supportedFeatures: EVM_FEATURES(ChainId.MOONBASE),
    signerSpec: getSignerSpecForChain(ChainId.MOONBASE, ChainFamily.EVM),
  },
  fantom: {
    family: ChainFamily.EVM,
    id: ChainId.FANTOM,
    nativeId: "250",
    name: "Fantom",
    ticker: "FTM",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://rpcapi.fantom.network",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.FANTOM),
    signerSpec: getSignerSpecForChain(ChainId.FANTOM, ChainFamily.EVM),
  },
  mantle: {
    family: ChainFamily.EVM,
    id: ChainId.MANTLE,
    nativeId: "5000",
    name: "Mantle Network",
    ticker: "MNT",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://site1.moralis-nodes.com/mantle/b1bf079880e246da919aa45f441e1cdf",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: NATIVE_READ_WRITE_ONLY,
    signerSpec: getSignerSpecForChain(ChainId.MANTLE, ChainFamily.EVM),
  },
  rootstock: {
    family: ChainFamily.EVM,
    id: ChainId.ROOTSTOCK,
    nativeId: "30",
    name: "RootStock",
    ticker: "RBTC",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://public-node.rsk.co",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_ROOTSTOCK_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.ROOTSTOCK, ChainFamily.EVM),
  },
  "rootstock-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.ROOTSTOCK_TESTNET,
    nativeId: "31",
    name: "RootStock Testnet",
    ticker: "tRBTC",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://public-node.testnet.rsk.co",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.ROOTSTOCK,
    supportedFeatures: EVM_ROOTSTOCK_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.ROOTSTOCK_TESTNET, ChainFamily.EVM),
  },
  [ChainId.LITECOIN]: {
    id: ChainId.LITECOIN,
    name: "Litecoin",
    family: ChainFamily.BITCOIN,
    ticker: "LTC",
    decimals: 8,
    providers: [
      {
        type: ProviderType.blockchair,
        url: "https://api.blockchair.com/litecoin",
      },
    ],
    params: {
      confirmations: 6,
    },
    nativeId: "litecoin",
    supportedFeatures: BITCOIN_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.LITECOIN, ChainFamily.BITCOIN),
  },
  [ChainId.DOGECOIN]: {
    id: ChainId.DOGECOIN,
    name: "Dogecoin",
    family: ChainFamily.BITCOIN,
    ticker: "DOGE",
    decimals: 8,
    providers: [
      {
        type: ProviderType.blockchair,
        url: "https://api.blockchair.com/dogecoin",
      },
    ],
    params: {
      confirmations: 60, // confirmations used by Coinbase or Binance
    },
    nativeId: "dogecoin",
    supportedFeatures: BITCOIN_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.DOGECOIN, ChainFamily.BITCOIN),
  },
  ton: {
    family: ChainFamily.TON,
    id: ChainId.TON,
    nativeId: "ton",
    name: "TON",
    ticker: "TON",
    decimals: 9,
    providers: [
      {
        type: ProviderType.node,
        url: "https://toncenter.com/api/",
      },
      {
        type: ProviderType.tonapi,
        url: "https://tonapi.io",
      },
    ],
    supportedFeatures: TON_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.TON, ChainFamily.TON),
  },
  chiliz: {
    family: ChainFamily.EVM,
    id: ChainId.CHILIZ,
    nativeId: "88888",
    name: "Chiliz Chain",
    ticker: "CHZ",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://chiliz-rpc.publicnode.com",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.CHILIZ),
    signerSpec: getSignerSpecForChain(ChainId.CHILIZ, ChainFamily.EVM),
  },
  "chiliz-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.CHILIZ_TESTNET,
    nativeId: "88882",
    name: "Chiliz Spicy Testnet",
    ticker: "CHZ",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://chiliz-spicy.publicnode.com",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    isTestnetFor: ChainId.CHILIZ,
    supportedFeatures: EVM_FEATURES(ChainId.CHILIZ_TESTNET),
    signerSpec: getSignerSpecForChain(ChainId.CHILIZ_TESTNET, ChainFamily.EVM),
  },
  //Injective Cosmos based version
  injective: {
    family: ChainFamily.COSMOS,
    id: ChainId.INJECTIVE,
    nativeId: "injective-1",
    name: "Injective",
    ticker: "INJ",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        //url: "https://apis.mintscan.io/injective/lcd", // Error when computing tx fees
        url: "https://lcd-injective.imperator.co", // FIXME Frequent HTTP 502 errors!
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "inj",
      validatorPrefix: "injvaloper",
      denom: "inj",
      // eth_secp256k1 instead of secp256k1 (see https://docs.injective.network/learn/basic-concepts/accounts/)
      defaultPubKeyType: "/injective.crypto.v1beta1.ethsecp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 700000000,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.INJECTIVE),
    signerSpec: getSignerSpecForChain(ChainId.INJECTIVE, ChainFamily.COSMOS),
  },
  akash: {
    family: ChainFamily.COSMOS,
    id: ChainId.AKASH,
    nativeId: "akashnet-2",
    name: "Akash",
    ticker: "AKT",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-akash.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "akash",
      validatorPrefix: "akashvaloper",
      denom: "uakt",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.0025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.AKASH),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/akash/chain.json
    signerSpec: getSignerSpecForChain(ChainId.AKASH, ChainFamily.COSMOS),
  },

  band: {
    family: ChainFamily.COSMOS,
    id: ChainId.BAND,
    nativeId: "laozi-mainnet",
    name: "Band Protocol",
    ticker: "BAND",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-band.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "band",
      validatorPrefix: "bandvaloper",
      denom: "uband",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.003,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.BAND),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/bandchain/chain.json
    signerSpec: getSignerSpecForChain(ChainId.BAND, ChainFamily.COSMOS),
  },

  //Dymension seems to be EVM based in its transaction handling
  dymension: {
    family: ChainFamily.COSMOS,
    id: ChainId.DYMENSION,
    nativeId: "dymension_1100-1",
    name: "Dymension",
    ticker: "DYM",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-dymension.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "dym",
      validatorPrefix: "dymvaloper",
      denom: "adym",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 5000000000,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.DYMENSION),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/dymension/chain.json
    signerSpec: getSignerSpecForChain(ChainId.DYMENSION, ChainFamily.COSMOS),
  },

  kyve: {
    family: ChainFamily.COSMOS,
    id: ChainId.KYVE,
    nativeId: "kyve-1",
    name: "KYVE",
    ticker: "KYVE",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-kyve.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "kyve",
      validatorPrefix: "kyvevaloper",
      denom: "ukyve",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.03,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.KYVE),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/kyve/chain.json
    signerSpec: getSignerSpecForChain(ChainId.KYVE, ChainFamily.COSMOS),
  },

  neutron: {
    family: ChainFamily.COSMOS,
    id: ChainId.NEUTRON,
    nativeId: "neutron-1",
    name: "Neutron",
    ticker: "NTRN",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-neutron.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "neutron",
      validatorPrefix: "neutronvaloper",
      denom: "untrn",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.0053,
      isICS: true,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.NEUTRON),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/neutron/chain.json
    signerSpec: getSignerSpecForChain(ChainId.NEUTRON, ChainFamily.COSMOS),
  },

  //Terra 2 is the rebirthed version of Terra
  terra2: {
    family: ChainFamily.COSMOS,
    id: ChainId.TERRA,
    nativeId: "phoenix-1",
    name: "Terra",
    ticker: "LUNA",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-terra.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "terra",
      validatorPrefix: "terravaloper",
      denom: "uluna",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.015,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.TERRA),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/terra2/chain.json
    signerSpec: getSignerSpecForChain(ChainId.TERRA, ChainFamily.COSMOS),
  },

  stargaze: {
    family: ChainFamily.COSMOS,
    id: ChainId.STARGAZE,
    nativeId: "stargaze-1",
    name: "Stargaze",
    ticker: "STARS",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://stargaze-api.polkachu.com/",
        //url: "https://lcd-stargaze.imperator.co", // Randomly long response times, up to 60s and more...
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "stars",
      validatorPrefix: "starsvaloper",
      denom: "ustars",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.1, // Value for polkachu node
      //minGasPrice: 0.0025, // Value for imperator node
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.STARGAZE),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/stargaze/chain.json
    signerSpec: getSignerSpecForChain(ChainId.STARGAZE, ChainFamily.COSMOS),
  },
  tron: {
    family: ChainFamily.TRON,
    id: ChainId.TRON,
    nativeId: "tron",
    name: "Tron",
    ticker: "TRX",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://api.trongrid.io",
      },
      {
        type: ProviderType.tronscan,
        url: "https://apilist.tronscanapi.com",
      },
      {
        type: ProviderType.oklink,
        url: "https://www.oklink.com/api/v5/explorer",
      },
    ],
    supportedFeatures: TRON_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.TRON, ChainFamily.TRON),
  },
  evmos: {
    family: ChainFamily.COSMOS,
    id: ChainId.EVMOS,
    nativeId: "evmos_9001-2",
    name: "Evmos",
    ticker: "EVMOS",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-evmos.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "evmos",
      validatorPrefix: "evmosvaloper",
      denom: "aevmos",
      //TODO: do the same as for Injective as the signature scheme might be different
      defaultPubKeyType: "/ethermint.crypto.v1.ethsecp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 25000000000,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.EVMOS),
    signerSpec: getSignerSpecForChain(ChainId.EVMOS, ChainFamily.COSMOS),
  },

  irisnet: {
    family: ChainFamily.COSMOS,
    id: ChainId.IRISNET,
    nativeId: "irishub-1",
    name: "IRISnet",
    ticker: "IRIS",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-iris.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "iaa",
      validatorPrefix: "iva",
      denom: "uiris",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.3,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.IRISNET),
    signerSpec: getSignerSpecForChain(ChainId.IRISNET, ChainFamily.COSMOS),
  },

  juno: {
    family: ChainFamily.COSMOS,
    id: ChainId.JUNO,
    nativeId: "juno-1",
    name: "Juno",
    ticker: "JUNO",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-juno.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "juno",
      validatorPrefix: "junovaloper",
      denom: "ujuno",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.1,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.JUNO),
    signerSpec: getSignerSpecForChain(ChainId.JUNO, ChainFamily.COSMOS),
  },

  "lum-network": {
    family: ChainFamily.COSMOS,
    id: ChainId.LUM_NETWORK,
    nativeId: "lum-network-1",
    name: "Lum Network",
    ticker: "LUM",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-lum.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "lum",
      validatorPrefix: "lumvaloper",
      denom: "ulum",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.LUM_NETWORK),
    signerSpec: getSignerSpecForChain(ChainId.LUM_NETWORK, ChainFamily.COSMOS),
  },

  omniflix: {
    family: ChainFamily.COSMOS,
    id: ChainId.OMNIFLIX,
    nativeId: "omniflixhub-1",
    name: "OmniFlix",
    ticker: "FLIX",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-omniflix.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "omniflix",
      validatorPrefix: "omniflixvaloper",
      denom: "uflix",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.0025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.OMNIFLIX),
    signerSpec: getSignerSpecForChain(ChainId.OMNIFLIX, ChainFamily.COSMOS),
  },

  sei: {
    family: ChainFamily.COSMOS,
    id: ChainId.SEI,
    nativeId: "pacific-1",
    name: "Sei",
    ticker: "SEI",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://sei-api.polkachu.com/",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "sei",
      validatorPrefix: "seivaloper",
      denom: "usei",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.02,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.SEI),
    signerSpec: getSignerSpecForChain(ChainId.SEI, ChainFamily.COSMOS),
  },

  medibloc: {
    family: ChainFamily.COSMOS,
    id: ChainId.MEDIBLOC,
    nativeId: "panacea-3",
    name: "MediBloc",
    ticker: "MED",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-medibloc.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "panacea",
      validatorPrefix: "panaceavaloper",
      denom: "umed",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 7,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.MEDIBLOC),
    signerSpec: getSignerSpecForChain(ChainId.MEDIBLOC, ChainFamily.COSMOS),
  },

  passage: {
    family: ChainFamily.COSMOS,
    id: ChainId.PASSAGE,
    nativeId: "passage-2",
    name: "Passage",
    ticker: "PASG",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-passage.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "pasg",
      validatorPrefix: "pasgvaloper",
      denom: "upasg",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.0025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.PASSAGE),
    signerSpec: getSignerSpecForChain(ChainId.PASSAGE, ChainFamily.COSMOS),
  },

  quasar: {
    family: ChainFamily.COSMOS,
    id: ChainId.QUASAR,
    nativeId: "quasar-1",
    name: "Quasar",
    ticker: "QSR",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-quasar.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "quasar",
      validatorPrefix: "quasarvaloper",
      denom: "uqsr",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.25,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.QUASAR),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/quasar/chain.json
    signerSpec: getSignerSpecForChain(ChainId.QUASAR, ChainFamily.COSMOS),
  },

  seda: {
    family: ChainFamily.COSMOS,
    id: ChainId.SEDA,
    nativeId: "seda-1",
    name: "Seda",
    ticker: "SEDA",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://seda-api.polkachu.com/",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "seda",
      validatorPrefix: "sedavaloper",
      denom: "aseda",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 10000000000,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.SEDA),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/seda/chain.json
    signerSpec: getSignerSpecForChain(ChainId.SEDA, ChainFamily.COSMOS),
  },

  sommelier: {
    family: ChainFamily.COSMOS,
    id: ChainId.SOMMELIER,
    nativeId: "sommelier-3",
    name: "Sommelier",
    ticker: "SOMM",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-sommelier.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "somm",
      validatorPrefix: "sommvaloper",
      denom: "usomm",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.SOMMELIER),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/sommelier/chain.json
    signerSpec: getSignerSpecForChain(ChainId.SOMMELIER, ChainFamily.COSMOS),
  },

  shentu: {
    family: ChainFamily.COSMOS,
    id: ChainId.SHENTU,
    nativeId: "shentu-2.2",
    name: "Shentu",
    ticker: "CTK",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-shentu.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "shentu",
      validatorPrefix: "shentuvaloper",
      denom: "uctk",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.SHENTU),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/shentu/chain.json
    signerSpec: getSignerSpecForChain(ChainId.SHENTU, ChainFamily.COSMOS),
  },

  stride: {
    family: ChainFamily.COSMOS,
    id: ChainId.STRIDE,
    nativeId: "stride-1",
    name: "Stride",
    ticker: "STRD",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://lcd-stride.imperator.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "stride",
      validatorPrefix: "stridevaloper",
      denom: "ustrd",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.005,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.STRIDE),
    signerSpec: getSignerSpecForChain(ChainId.STRIDE, ChainFamily.COSMOS),
  },

  chihuahua: {
    family: ChainFamily.COSMOS,
    id: ChainId.CHIHUAHUA,
    nativeId: "chihuahua-1",
    name: "Chihuahua",
    ticker: "HUAHUA",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://chihuahua-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "chihuahua",
      validatorPrefix: "chihuahuavaloper",
      denom: "uhuahua",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.CHIHUAHUA),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/chihuahua/chain.json
    signerSpec: getSignerSpecForChain(ChainId.CHIHUAHUA, ChainFamily.COSMOS),
  },
  bitsong: {
    family: ChainFamily.COSMOS,
    id: ChainId.BITSONG,
    nativeId: "bitsong-1",
    name: "Bitsong",
    ticker: "BTSG",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://bitsong-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "bitsong",
      validatorPrefix: "bitsongvaloper",
      denom: "ubtsg",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.BITSONG),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/bitsong/chain.json
    signerSpec: getSignerSpecForChain(ChainId.BITSONG, ChainFamily.COSMOS),
  },
  persistence: {
    family: ChainFamily.COSMOS,
    id: ChainId.PERSISTENCE,
    nativeId: "core-1",
    name: "Persistence",
    ticker: "XPRT",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://persistence-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "persistence",
      validatorPrefix: "persistencevaloper",
      denom: "uxprt",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.PERSISTENCE),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/persistence/chain.json
    signerSpec: getSignerSpecForChain(ChainId.PERSISTENCE, ChainFamily.COSMOS),
  },
  comdex: {
    family: ChainFamily.COSMOS,
    id: ChainId.COMDEX,
    nativeId: "comdex-1",
    name: "Comdex",
    ticker: "CMDX",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://comdex-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "comdex",
      validatorPrefix: "comdexvaloper",
      denom: "ucmdx",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.COMDEX),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/comdex/chain.json
    signerSpec: getSignerSpecForChain(ChainId.COMDEX, ChainFamily.COSMOS),
  },
  "fetch-ai": {
    family: ChainFamily.COSMOS,
    id: ChainId.FETCH_AI,
    nativeId: "fetchhub-4",
    name: "Fetch.ai",
    ticker: "FET",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://fetch-api.polkachu.com/",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "fetch",
      validatorPrefix: "fetchvaloper",
      denom: "afet",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.FETCH_AI),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/fetchhub/chain.json
    signerSpec: getSignerSpecForChain(ChainId.FETCH_AI, ChainFamily.COSMOS),
  },
  "humans-ai": {
    family: ChainFamily.COSMOS,
    id: ChainId.HUMANS_AI,
    nativeId: "humans_1",
    name: "Humans.ai",
    ticker: "HEART",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://humans-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "human",
      validatorPrefix: "humanvaloper",
      denom: "uheart",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.HUMANS_AI),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/humans/chain.json
    signerSpec: getSignerSpecForChain(ChainId.HUMANS_AI, ChainFamily.COSMOS),
  },
  ki: {
    family: ChainFamily.COSMOS,
    id: ChainId.KI,
    nativeId: "kichain-2",
    name: "Ki Chain",
    ticker: "XKI",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://ki-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "ki",
      validatorPrefix: "kivaloper",
      denom: "uxki",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.KI),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/kichain/chain.json
    signerSpec: getSignerSpecForChain(ChainId.KI, ChainFamily.COSMOS),
  },
  likecoin: {
    family: ChainFamily.COSMOS,
    id: ChainId.LIKECOIN,
    nativeId: "likecoin-mainnet-2",
    name: "LikeCoin",
    ticker: "LIKE",
    decimals: 9,
    providers: [
      {
        type: ProviderType.node,
        url: "https://mainnet-node.like.co",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "like",
      validatorPrefix: "likevaloper",
      denom: "nanolike",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 1,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.LIKECOIN),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/likecoin/chain.json
    signerSpec: getSignerSpecForChain(ChainId.LIKECOIN, ChainFamily.COSMOS),
  },
  "mars-hub": {
    family: ChainFamily.COSMOS,
    id: ChainId.MARS_HUB,
    nativeId: "mars-1",
    name: "Mars Hub",
    ticker: "MARS",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://mars-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "mars",
      validatorPrefix: "marsvaloper",
      denom: "umars",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.MARS_HUB),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/mars/chain.json
    signerSpec: getSignerSpecForChain(ChainId.MARS_HUB, ChainFamily.COSMOS),
  },
  provenance: {
    family: ChainFamily.COSMOS,
    id: ChainId.PROVENANCE,
    nativeId: "pio-mainnet-1",
    name: "Provenance",
    ticker: "HASH",
    decimals: 9,
    providers: [
      {
        type: ProviderType.node,
        url: "https://provenance-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "pb",
      validatorPrefix: "pbvaloper",
      denom: "nhash",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 1905,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.PROVENANCE),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/provenance/chain.json
    signerSpec: getSignerSpecForChain(ChainId.PROVENANCE, ChainFamily.COSMOS),
  },
  quicksilver: {
    family: ChainFamily.COSMOS,
    id: ChainId.QUICKSILVER,
    nativeId: "quicksilver-2",
    name: "Quicksilver",
    ticker: "QCK",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://quicksilver-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "quick",
      validatorPrefix: "quickvaloper",
      denom: "uqck",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.QUICKSILVER),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/quicksilver/chain.json
    signerSpec: getSignerSpecForChain(ChainId.QUICKSILVER, ChainFamily.COSMOS),
  },
  saga: {
    family: ChainFamily.COSMOS,
    id: ChainId.SAGA,
    nativeId: "saga-1",
    name: "Saga",
    ticker: "SAGA",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://saga-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "saga",
      validatorPrefix: "sagavaloper",
      denom: "usaga",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.SAGA),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/saga/chain.json
    signerSpec: getSignerSpecForChain(ChainId.SAGA, ChainFamily.COSMOS),
  },
  "ux-chain": {
    family: ChainFamily.COSMOS,
    id: ChainId.UX_CHAIN,
    nativeId: "ux-1",
    name: "UX Chain",
    ticker: "UX",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://ux-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "ux",
      validatorPrefix: "uxvaloper",
      denom: "uux",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.UX_CHAIN),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/ux/chain.json
    signerSpec: getSignerSpecForChain(ChainId.UX_CHAIN, ChainFamily.COSMOS),
  },
  kava: {
    family: ChainFamily.COSMOS,
    id: ChainId.KAVA,
    nativeId: "kava_2222-10",
    name: "Kava",
    ticker: "KAVA",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://kava-api.polkachu.com",
      },
      {
        type: ProviderType.mintscan,
        url: "https://apis.mintscan.io/v1",
      },
    ],
    params: {
      prefix: "kava",
      validatorPrefix: "kavavaloper",
      denom: "ukava",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.KAVA),
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/kava/chain.json
    signerSpec: getSignerSpecForChain(ChainId.KAVA, ChainFamily.COSMOS),
  },
  starknet: {
    family: ChainFamily.STARKNET,
    id: ChainId.STARKNET,
    nativeId: "starknet",
    name: "Starknet",
    ticker: "STRK",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://starknet-mainnet.public.blastapi.io/rpc/v0_7", //FIXME: Find a better node
      },
      {
        type: ProviderType.starkscan,
        url: "https://api.starkscan.co",
      },
    ],
    supportedFeatures: STARKNET_FEATURES,
    signerSpec: getSignerSpecForChain(ChainId.STARKNET, ChainFamily.STARKNET),
  },
  // TODO Test this (later)
  /*
  babylon: {
    family: ChainFamily.COSMOS,
    id: ChainId.BABYLON,
    nativeId: "bbn-1",
    name: "Babylon",
    ticker: "BABY",
    decimals: 6,
    backends: {
      nodeURL: "TODO",
    },
    params: {
      prefix: "bbn",
      validatorPrefix: "bbnvaloper",
      denom: "ubbn",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.007,
    },
    supportedFeatures: COSMOS_FEATURES(ChainId.BABYLON),
  },
  */
  "babylon-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.BABYLON_TESTNET,
    nativeId: "bbn-test-5",
    name: "Babylon Testnet",
    ticker: "BABY",
    decimals: 6,
    providers: [
      {
        type: ProviderType.node,
        url: "https://babylon-testnet-api.polkachu.com",
      },
    ],
    params: {
      prefix: "bbn",
      validatorPrefix: "bbnvaloper",
      denom: "ubbn",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.007,
    },
    isTestnetFor: "BABYLON", //TODO: update with ChainId.BABYLON when it's added
    supportedFeatures: COSMOS_FEATURES(ChainId.BABYLON_TESTNET),
    signerSpec: getSignerSpecForChain(ChainId.BABYLON_TESTNET, ChainFamily.COSMOS),
  },
  "monad-testnet": {
    id: ChainId.MONAD_TESTNET,
    name: "Monad Private Testnet",
    family: ChainFamily.EVM,
    nativeId: "10143",
    ticker: "MON",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://testnet-rpc.monad.xyz/",
      },
      {
        type: ProviderType.alchemy,
        url: "https://monad-testnet.g.alchemy.com/v2/0k8SiAAwbukxESqUwUHjgdMlabpyUd1g",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.MONAD_TESTNET),
    isTestnetFor: "monad",
    signerSpec: getSignerSpecForChain(ChainId.MONAD_TESTNET, ChainFamily.EVM),
  },
  berachain: {
    id: ChainId.BERACHAIN,
    name: "Berachain",
    family: ChainFamily.EVM,
    nativeId: "80094",
    ticker: "BERA",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://rpc.berachain.com/",
      },
      {
        type: ProviderType.alchemy,
        url: "https://berachain-mainnet.g.alchemy.com/v2/0k8SiAAwbukxESqUwUHjgdMlabpyUd1g",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.BERACHAIN),
    signerSpec: getSignerSpecForChain(ChainId.BERACHAIN, ChainFamily.EVM),
  },
  "berachain-artio": {
    id: ChainId.BERACHAIN_ARTIO,
    name: "Berachain Artio",
    family: ChainFamily.EVM,
    nativeId: "80084",
    ticker: "BERA",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://bartio.rpc.berachain.com",
      },
      {
        type: ProviderType.alchemy,
        url: "https://berachain-bartio.g.alchemy.com/v2/0k8SiAAwbukxESqUwUHjgdMlabpyUd1g",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.BERACHAIN_ARTIO),
    isTestnetFor: ChainId.BERACHAIN,
    signerSpec: getSignerSpecForChain(ChainId.BERACHAIN_ARTIO, ChainFamily.EVM),
  },
  cronos: {
    id: ChainId.CRONOS,
    name: "CRONOS",
    family: ChainFamily.EVM,
    nativeId: "25",
    ticker: "CRO",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://evm.cronos.org",
      },
      {
        type: ProviderType.moralis,
        url: "https://deep-index.moralis.io/api",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.CRONOS),
    signerSpec: getSignerSpecForChain(ChainId.CRONOS, ChainFamily.EVM),
  },
  "world-chain": {
    id: ChainId.WORLD_CHAIN,
    name: "Worldchain",
    family: ChainFamily.EVM,
    nativeId: "480",
    ticker: "WLD",
    decimals: 18,
    providers: [
      {
        type: ProviderType.node,
        url: "https://worldchain-mainnet.g.alchemy.com/v2/0k8SiAAwbukxESqUwUHjgdMlabpyUd1g",
      },
      {
        type: ProviderType.alchemy,
        url: "https://worldchain-mainnet.g.alchemy.com/v2/0k8SiAAwbukxESqUwUHjgdMlabpyUd1g",
      },
    ],
    supportedFeatures: EVM_FEATURES(ChainId.WORLD_CHAIN),
    signerSpec: getSignerSpecForChain(ChainId.WORLD_CHAIN, ChainFamily.EVM),
  },
} as const;

function getSupportedTransactionModes(chainId: ChainId): TransactionMode[] {
  const transactionFeatures = CHAINS[chainId].supportedFeatures.write.transaction.type;

  const supportedFeatures = Object.entries(transactionFeatures).filter((entry) => entry[1] === true);
  const supportedModes = Object.keys(supportedFeatures) as TransactionMode[];

  return supportedModes;
}

export { CHAINS, getSupportedTransactionModes };
