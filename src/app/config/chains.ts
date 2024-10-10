import { Chain, ChainFamily, ChainId, TransactionMode } from "../model/types_WIP";
import {
  ALGORAND_FEATURES,
  BITCOIN_FEATURES,
  COSMOS_FEATURES,
  EVM_FEATURES,
  EVM_ROOTSTOCK_FEATURES,
  NATIVE_READ_WRITE_FEATURES,
  TON_FEATURES,
} from "./features";

const CHAINS: { [key in ChainId]: Chain } = {
  algorand: {
    family: ChainFamily.ALGORAND,
    id: ChainId.ALGORAND,
    nativeId: "algorand",
    name: "Algorand",
    ticker: "ALGO",
    decimals: 6,
    backends: {
      nodeURL: "https://mainnet-api.algonode.cloud/v2",
      explorerURL: "https://mainnet-idx.algonode.cloud/v2",
    },
    supportedFeatures: ALGORAND_FEATURES,
  },
  cosmoshub: {
    family: ChainFamily.COSMOS,
    id: ChainId.COSMOSHUB,
    nativeId: "cosmoshub-4",
    name: "CosmosHub",
    ticker: "ATOM",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-cosmos.imperator.co",
    },
    params: {
      prefix: "cosmos",
      validatorPrefix: "cosmosvaloper",
      denom: "uatom",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES,
  },
  "cosmoshub-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.COSMOSHUB_TESTNET,
    nativeId: "theta-testnet-001",
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
    supportedFeatures: COSMOS_FEATURES,
  },
  osmosis: {
    family: ChainFamily.COSMOS,
    id: ChainId.OSMOSIS,
    nativeId: "osmosis-1",
    name: "Osmosis",
    ticker: "OSMO",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-osmosis.imperator.co",
    },
    params: {
      prefix: "osmo",
      validatorPrefix: "osmovaloper",
      denom: "uosmo",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
    supportedFeatures: COSMOS_FEATURES,
  },
  "osmosis-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.OSMOSIS_TESTNET,
    nativeId: "osmo-test-5",
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
    supportedFeatures: COSMOS_FEATURES,
  },
  celestia: {
    family: ChainFamily.COSMOS,
    id: ChainId.CELESTIA,
    nativeId: "celestia",
    name: "Celestia",
    ticker: "TIA",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-celestia.imperator.co",
    },
    params: {
      prefix: "celestia",
      validatorPrefix: "celestiavaloper",
      denom: "utia",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.02,
    },
    supportedFeatures: COSMOS_FEATURES,
  },
  "celestia-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.CELESTIA_TESTNET,
    nativeId: "mocha-4",
    name: "Celestia Testnet",
    ticker: "TIA",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/celestiatm/rest/REDACTED",
    },
    isTestNet: true,
    params: {
      prefix: "celestia",
      validatorPrefix: "celestiavaloper",
      denom: "utia",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.02,
    },
    supportedFeatures: COSMOS_FEATURES,
  },
  dydx: {
    family: ChainFamily.COSMOS,
    id: ChainId.DYDX,
    nativeId: "dydx-mainnet-1",
    name: "dYdX Protocol",
    ticker: "DYDX",
    decimals: 18,
    backends: {
      // (configs can be checked with [nodeURL]/cosmos/base/node/v1beta1/config )
      nodeURL: "https://dydx-rest.publicnode.com",
      // nodeURL: "https://dydx-dao-api.polkachu.com", // Same as Ledger Live, but we've been blacklisted...
      //nodeURL: "https://lcd-dydx.imperator.co", // Should be the best one, but only accepts fees in IBC token USDC at the moment...
      //nodeURL: "https://community.nuxian-node.ch:6797/dydx/crpc", // Demands twice the standard minimum gas fees, for some reason
    },
    params: {
      prefix: "dydx",
      validatorPrefix: "dydxvaloper",
      denom: "adydx",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 12500000000,
    },
    supportedFeatures: COSMOS_FEATURES,
  },
  axelar: {
    family: ChainFamily.COSMOS,
    id: ChainId.AXELAR,
    nativeId: "axelar-dojo-1",
    name: "Axelar",
    ticker: "AXL",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-axelar.imperator.co",
    },
    params: {
      prefix: "axelar",
      validatorPrefix: "axelarvaloper",
      denom: "uaxl",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.007,
    },
    supportedFeatures: COSMOS_FEATURES,
  },
  ethereum: {
    family: ChainFamily.EVM,
    id: ChainId.ETHEREUM,
    nativeId: "1",
    name: "Ethereum",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://ethereum-rpc.publicnode.com",
      nodeURL: "https://site1.moralis-nodes.com/eth/REDACTED",
      //explorerURL: "https://api.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  sepolia: {
    family: ChainFamily.EVM,
    id: ChainId.SEPOLIA,
    nativeId: "11155111",
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
    supportedFeatures: EVM_FEATURES,
  },
  holesky: {
    family: ChainFamily.EVM,
    id: ChainId.HOLESKY,
    nativeId: "17000",
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
    supportedFeatures: EVM_FEATURES,
  },
  zksync: {
    family: ChainFamily.EVM,
    id: ChainId.ZKSYNC,
    nativeId: "324",
    name: "ZkSync",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://zksync-mainnet.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      nodeURL: "https://site1.moralis-nodes.com/zksync/REDACTED",
      //explorerURL: "https://zksync.blockscout.com/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  "zksync-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.ZKSYNC_SEPOLIA,
    nativeId: "300",
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
    supportedFeatures: EVM_FEATURES,
  },
  //INJECTIVE-TESTNET EVM Version
  "injective-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.INJECTIVE_TESTNET,
    nativeId: "2424",
    name: "Injective",
    ticker: "INJ",
    decimals: 18,
    backends: {
      nodeURL: "https://testnet.rpc.inevm.com/http",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: EVM_FEATURES,
  },
  base: {
    family: ChainFamily.EVM,
    id: ChainId.BASE,
    nativeId: "8453",
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
      isL2Fees: true,
    },
    supportedFeatures: EVM_FEATURES,
  },
  "base-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.BASE_SEPOLIA,
    nativeId: "84532",
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
      isL2Fees: true,
    },
    supportedFeatures: EVM_FEATURES,
  },
  optimism: {
    family: ChainFamily.EVM,
    id: ChainId.OPTIMISM,
    nativeId: "10",
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
      isL2Fees: true,
    },
    supportedFeatures: EVM_FEATURES,
  },
  "optimism-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.OPTIMISM_SEPOLIA,
    nativeId: "11155420",
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
      isL2Fees: true,
    },
    supportedFeatures: EVM_FEATURES,
  },
  arbitrum: {
    family: ChainFamily.EVM,
    id: ChainId.ARBITRUM,
    nativeId: "42161",
    name: "Arbitrum One",
    ticker: "ETH",
    decimals: 18,
    backends: {
      //nodeURL: "https://arbitrum-one.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      nodeURL: "https://site1.moralis-nodes.com/arbitrum/REDACTED",
      //explorerURL: "https://api.arbiscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  "arbitrum-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.ARBITRUM_SEPOLIA,
    nativeId: "421614",
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
    supportedFeatures: EVM_FEATURES,
  },
  [ChainId.BITCOIN]: {
    id: ChainId.BITCOIN,
    name: "Bitcoin",
    family: ChainFamily.BITCOIN,
    ticker: "BTC",
    decimals: 8,
    backends: {
      nodeURL: "",
      explorerURL: "https://api.blockchair.com/bitcoin",
    },
    params: {
      confirmations: 6,
    },
    nativeId: "bitcoin",
    supportedFeatures: BITCOIN_FEATURES,
  },
  [ChainId.BITCOIN_TESTNET]: {
    id: ChainId.BITCOIN_TESTNET,
    name: "Bitcoin testnet",
    family: ChainFamily.BITCOIN,
    ticker: "BTC",
    decimals: 8,
    backends: {
      nodeURL: "",
      explorerURL: "https://api.blockchair.com/bitcoin/testnet",
    },
    isTestNet: true,
    params: {
      confirmations: 6,
    },
    nativeId: "bitcoin-testnet",
    supportedFeatures: BITCOIN_FEATURES,
  },
  polygon: {
    family: ChainFamily.EVM,
    id: ChainId.POLYGON,
    nativeId: "137",
    name: "Polygon",
    ticker: "POL",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/polygon/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  "polygon-amoy": {
    family: ChainFamily.EVM,
    id: ChainId.POLYGON_AMOY,
    nativeId: "80002",
    name: "Polygon Amoy",
    ticker: "MATIC",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/amoy/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: EVM_FEATURES,
  },
  bsc: {
    family: ChainFamily.EVM,
    id: ChainId.BSC,
    nativeId: "56",
    name: "Binance Smart Chain",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  "bsc-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.BSC_TESTNET,
    nativeId: "97",
    name: "Binance Smart Chain Testnet",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc-testnet/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: EVM_FEATURES,
  },
  linea: {
    family: ChainFamily.EVM,
    id: ChainId.LINEA,
    nativeId: "59144",
    name: "Linea",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/linea/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  "linea-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.LINEA_SEPOLIA,
    nativeId: "59141",
    name: "Linea Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/linea-sepolia/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: EVM_FEATURES,
  },
  avalanche: {
    family: ChainFamily.EVM,
    id: ChainId.AVALANCHE,
    nativeId: "43114",
    name: "Avalanche",
    ticker: "AVAX",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/avalanche/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  "avalanche-fuji": {
    family: ChainFamily.EVM,
    id: ChainId.AVALANCHE_FUJI,
    nativeId: "43113",
    name: "Avalanche Fuji Testnet",
    ticker: "AVAX",
    decimals: 18,
    backends: {
      nodeURL: "https://avalanche-fuji-c-chain-rpc.publicnode.com",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
    isTestNet: true,
  },
  gnosis: {
    family: ChainFamily.EVM,
    id: ChainId.GNOSIS,
    nativeId: "100",
    name: "Gnosis",
    ticker: "xDAI",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  "gnosis-chiado": {
    family: ChainFamily.EVM,
    id: ChainId.GNOSIS_CHIADO,
    nativeId: "10200",
    name: "Gnosis Chiado",
    ticker: "xDAI",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis-testnet/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: EVM_FEATURES,
  },
  moonbeam: {
    family: ChainFamily.EVM,
    id: ChainId.MOONBEAM,
    nativeId: "1284",
    name: "Moonbeam",
    ticker: "GLMR",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonbeam/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  moonriver: {
    family: ChainFamily.EVM,
    id: ChainId.MOONRIVER,
    nativeId: "1285",
    name: "Moonriver",
    ticker: "MOVR",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonriver/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  moonbase: {
    family: ChainFamily.EVM,
    id: ChainId.MOONBASE,
    nativeId: "1287",
    name: "Moonbase",
    ticker: "DEV",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonbase/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: EVM_FEATURES,
  },
  fantom: {
    family: ChainFamily.EVM,
    id: ChainId.FANTOM,
    nativeId: "250",
    name: "Fantom",
    ticker: "FTM",
    decimals: 18,
    backends: {
      nodeURL: "https://rpcapi.fantom.network",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  mantle: {
    family: ChainFamily.EVM,
    id: ChainId.MANTLE,
    nativeId: "5000",
    name: "Mantle Network",
    ticker: "MNT",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/mantle/REDACTED",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: NATIVE_READ_WRITE_FEATURES,
  },
  rootstock: {
    family: ChainFamily.EVM,
    id: ChainId.ROOTSTOCK,
    nativeId: "30",
    name: "RootStock Mainnet",
    ticker: "RBTC",
    decimals: 18,
    backends: {
      nodeURL: "https://public-node.rsk.co",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_ROOTSTOCK_FEATURES,
  },
  "rootstock-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.ROOTSTOCK_TESTNET,
    nativeId: "31",
    name: "RootStock Testnet",
    ticker: "tRBTC",
    decimals: 18,
    backends: {
      nodeURL: "https://public-node.testnet.rsk.co",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: EVM_ROOTSTOCK_FEATURES,
  },
  [ChainId.LITECOIN]: {
    id: ChainId.LITECOIN,
    name: "Litecoin",
    family: ChainFamily.BITCOIN,
    ticker: "LTC",
    decimals: 8,
    backends: {
      nodeURL: "",
      explorerURL: "https://api.blockchair.com/litecoin",
    },
    params: {
      confirmations: 6,
    },
    nativeId: "litecoin",
    supportedFeatures: BITCOIN_FEATURES,
  },
  [ChainId.DOGECOIN]: {
    id: ChainId.DOGECOIN,
    name: "Dogecoin",
    family: ChainFamily.BITCOIN,
    ticker: "DOGE",
    decimals: 8,
    backends: {
      nodeURL: "",
      explorerURL: "https://api.blockchair.com/dogecoin",
    },
    params: {
      confirmations: 60, // confirmations used by Coinbase or Binance
    },
    nativeId: "dogecoin",
    supportedFeatures: BITCOIN_FEATURES,
  },
  ton: {
    family: ChainFamily.TON,
    id: ChainId.TON,
    nativeId: "ton",
    name: "TON",
    ticker: "TON",
    decimals: 9,
    backends: {
      nodeURL: "https://toncenter.com/api/",
      explorerURL: "https://tonapi.io",
    },
    supportedFeatures: TON_FEATURES,
  },
  chiliz: {
    family: ChainFamily.EVM,
    id: ChainId.CHILIZ,
    nativeId: "88888",
    name: "Chiliz Chain",
    ticker: "CHZ",
    decimals: 18,
    backends: {
      nodeURL: "https://chiliz-rpc.publicnode.com",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: EVM_FEATURES,
  },
  "chiliz-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.CHILIZ_TESTNET,
    nativeId: "88882",
    name: "Chiliz Spicy Tesnet",
    ticker: "CHZ",
    decimals: 18,
    backends: {
      nodeURL: "https://chiliz-spicy.publicnode.com",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: EVM_FEATURES,
  },
  //Injective Cosmos based version
  injective: {
    family: ChainFamily.COSMOS,
    id: ChainId.INJECTIVE,
    nativeId: "injective-1",
    name: "Injective",
    ticker: "INJ",
    decimals: 18,
    backends: {
      nodeURL: "https://lcd-injective.imperator.co",
    },
    params: {
      prefix: "inj",
      validatorPrefix: "injvaloper",
      denom: "inj",
      // eth_secp256k1 instead of secp256k1 (see https://docs.injective.network/learn/basic-concepts/accounts/)
      defaultPubKeyType: "/injective.crypto.v1beta1.ethsecp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 700000000,
    },
    supportedFeatures: COSMOS_FEATURES,
  },
  akash: {
    family: ChainFamily.COSMOS,
    id: ChainId.AKASH,
    nativeId: "akashnet-2",
    name: "Akash",
    ticker: "AKT",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-akash.imperator.co",
    },
    params: {
      prefix: "akash",
      validatorPrefix: "akashvaloper",
      denom: "uakt",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.0025,
    },
    supportedFeatures: COSMOS_FEATURES,
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/akash/chain.json
  },

  band: {
    family: ChainFamily.COSMOS,
    id: ChainId.BAND,
    nativeId: "laozi-mainnet",
    name: "Band Protocol",
    ticker: "BAND",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-band.imperator.co",
    },
    params: {
      prefix: "band",
      validatorPrefix: "bandvaloper",
      denom: "uband",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.003,
    },
    supportedFeatures: COSMOS_FEATURES,
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/bandchain/chain.json
  },

  //Dymension seems to be EVM based in its transaction handling
  dymension: {
    family: ChainFamily.COSMOS,
    id: ChainId.DYMENSION,
    nativeId: "dymension_1100-1",
    name: "Dymension",
    ticker: "DYM",
    decimals: 18,
    backends: {
      nodeURL: "https://lcd-dymension.imperator.co",
    },
    params: {
      prefix: "dym",
      validatorPrefix: "dymvaloper",
      denom: "adym",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 5000000000,
    },
    supportedFeatures: COSMOS_FEATURES,
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/dymension/chain.json
  },

  kyve: {
    family: ChainFamily.COSMOS,
    id: ChainId.KYVE,
    nativeId: "kyve-1",
    name: "KYVE",
    ticker: "KYVE",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-kyve.imperator.co",
    },
    params: {
      prefix: "kyve",
      validatorPrefix: "kyvevaloper",
      denom: "ukyve",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.03,
    },
    supportedFeatures: COSMOS_FEATURES,
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/kyve/chain.json
  },

  neutron: {
    family: ChainFamily.COSMOS,
    id: ChainId.NEUTRON,
    nativeId: "neutron-1",
    name: "Neutron",
    ticker: "NTRN",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-neutron.imperator.co",
    },
    params: {
      prefix: "neutron",
      validatorPrefix: "neutronvaloper",
      denom: "untrn",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.0053,
    },
    supportedFeatures: COSMOS_FEATURES,
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/neutron/chain.json
  },

  //Terra 2 is the rebirthed version of Terra
  terra2: {
    family: ChainFamily.COSMOS,
    id: ChainId.TERRA,
    nativeId: "phoenix-1",
    name: "Terra",
    ticker: "LUNA",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-terra.imperator.co",
    },
    params: {
      prefix: "terra",
      validatorPrefix: "terravaloper",
      denom: "uluna",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.015,
    },
    supportedFeatures: COSMOS_FEATURES,
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/terra2/chain.json
  },

  stargaze: {
    family: ChainFamily.COSMOS,
    id: ChainId.STARGAZE,
    nativeId: "stargaze-1",
    name: "Stargaze",
    ticker: "STARS",
    decimals: 6,
    backends: {
      nodeURL: "https://lcd-stargaze.imperator.co",
    },
    params: {
      prefix: "stars",
      validatorPrefix: "starsvaloper",
      denom: "ustars",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000, // TODO: Verify this value for each specific chain
      minGasPrice: 0.0025,
    },
    supportedFeatures: COSMOS_FEATURES,
    // Chain info: https://github.com/cosmos/chain-registry/blob/master/stargaze/chain.json
  },
} as const;

// FIXME Trick to filter-out private 'backends' field from response
// Needs to be handled with DTO instead
// https://adamik.atlassian.net/browse/ADV-13
const CHAINS_PUBLIC = Object.fromEntries(
  Object.entries(CHAINS).map(([key, value]) => {
    const { backends, ...rest } = value;
    return [key, rest];
  })
);

function getSupportedTransactionModes(chainId: ChainId): TransactionMode[] {
  const supportedModes: TransactionMode[] = [];
  const supportedTransactions = CHAINS[chainId].supportedFeatures.write.transaction.type;

  if (supportedTransactions.native) {
    supportedModes.push(TransactionMode.TRANSFER);
  }
  if (supportedTransactions.tokens) {
    supportedModes.push(TransactionMode.TRANSFER_TOKEN);
  }
  if (supportedTransactions.staking) {
    supportedModes.push(TransactionMode.DELEGATE);
    supportedModes.push(TransactionMode.REDELEGATE);
    supportedModes.push(TransactionMode.UNDELEGATE);
    supportedModes.push(TransactionMode.CLAIM_REWARDS);
  }

  return supportedModes;
}

export { CHAINS, CHAINS_PUBLIC, getSupportedTransactionModes };
