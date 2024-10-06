import { Chain, ChainFamily, ChainFeature, ChainId, TransactionMode } from "../model/types_WIP";

const FEATURES: { [key in ChainFamily]: ChainFeature[] } = {
  [ChainFamily.ALGORAND]: [
    ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
    ChainFeature.READ_ACCOUNT_BALANCES_TOKENS,
    ChainFeature.READ_TRANSACTION_NATIVE,
    ChainFeature.READ_TRANSACTION_TOKENS,
    ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    ChainFeature.WRITE_TRANSACTION_TYPE_TOKENS,
    ChainFeature.WRITE_TRANSACTION_FIELD_MEMO,
  ],
  [ChainFamily.COSMOS]: [
    ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
    ChainFeature.READ_ACCOUNT_BALANCES_TOKENS,
    ChainFeature.READ_ACCOUNT_BALANCES_STAKING,
    ChainFeature.READ_TRANSACTION_NATIVE,
    //ChainFeature.READ_TRANSACTION_TOKENS,
    ChainFeature.READ_TRANSACTION_STAKING,
    ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    //ChainFeature.WRITE_TRANSACTION_TOKENS,
    ChainFeature.WRITE_TRANSACTION_TYPE_STAKING,
    ChainFeature.WRITE_TRANSACTION_FIELD_MEMO,
  ],
  [ChainFamily.EVM]: [
    ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
    ChainFeature.READ_ACCOUNT_BALANCES_TOKENS,
    ChainFeature.READ_TRANSACTION_NATIVE,
    ChainFeature.READ_TRANSACTION_TOKENS,
    ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    ChainFeature.WRITE_TRANSACTION_TYPE_TOKENS,
  ],
  [ChainFamily.BITCOIN]: [
    ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
    ChainFeature.READ_TRANSACTION_NATIVE,
    ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
  ],
  [ChainFamily.TON]: [
    ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
    ChainFeature.READ_ACCOUNT_BALANCES_TOKENS,
    ChainFeature.READ_TRANSACTION_NATIVE,
    ChainFeature.READ_TRANSACTION_TOKENS,
    ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    ChainFeature.WRITE_TRANSACTION_TYPE_TOKENS,
    ChainFeature.WRITE_TRANSACTION_FIELD_MEMO,
  ],
  [ChainFamily.TRON]: [
    ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
    ChainFeature.READ_ACCOUNT_BALANCES_TOKENS,
    ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
  ],
};

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
    supportedFeatures: FEATURES[ChainFamily.ALGORAND],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
  },
  "osmosis-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.OSMOSIS_TESTNET,
    nativeId: "osmo-test-5",
    name: "Osmosis Testnet",
    ticker: "OSMO",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/osmosist/rest/bfdb617358bd786c30374c8799978c27",
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
  },
  "celestia-testnet": {
    family: ChainFamily.COSMOS,
    id: ChainId.CELESTIA_TESTNET,
    nativeId: "mocha-4",
    name: "Celestia Testnet",
    ticker: "TIA",
    decimals: 6,
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/celestiatm/rest/bfdb617358bd786c30374c8799978c27",
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
      nodeURL: "https://site1.moralis-nodes.com/eth/edd8151f3c634ee2a808f34c47c7ad70",
      //explorerURL: "https://api.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/sepolia/fe0cd204d0324cae84cb27769d5ab205",
      //explorerURL: "https://api-sepolia.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/holesky/59fb652c988245799984ee5b4ff8c065",
      //explorerURL: "https://api-holesky.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/zksync/547c7bd4d8e24c62ae1f059e634b06ae",
      //explorerURL: "https://zksync.blockscout.com/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/zksync-sepolia/a55bf0a6af264a73b083323f58a5d50b",
      //explorerURL: "https://zksync.blockscout.com/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/base/9b6b18e784a54e03a0587a4b14c3c8c5",
      //explorerURL: "https://api.basescan.org/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      isL2Fees: true,
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/base-sepolia/55c79b8e9fbb41da84c53550ada7b1fb",
      //explorerURL: "https://api.basescan.org/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      isL2Fees: true,
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/optimism/f6e1593c1f3a4213811a1bae65bf4203",
      //explorerURL: "https://api-optimistic.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    params: {
      isL2Fees: true,
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/optimism-sepolia/e76f53f4949641a2b9c87571b7e03e87",
      //explorerURL: "https://api-sepolia-optimistic.etherscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    params: {
      isL2Fees: true,
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/arbitrum/98b1253e6794472db0999b44363fdb9c",
      //explorerURL: "https://api.arbiscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      nodeURL: "https://site1.moralis-nodes.com/arbitrum-sepolia/50db3911bb294983a8701b9c0930d80c",
      //explorerURL: "https://api-sepolia.arbiscan.io/api",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
    supportedFeatures: FEATURES[ChainFamily.BITCOIN],
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
    supportedFeatures: FEATURES[ChainFamily.BITCOIN],
  },
  polygon: {
    family: ChainFamily.EVM,
    id: ChainId.POLYGON,
    nativeId: "137",
    name: "Polygon",
    ticker: "POL",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/polygon/70eb3a5858dc4f0d8ca0e1a1cf8d375f",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  "polygon-amoy": {
    family: ChainFamily.EVM,
    id: ChainId.POLYGON_AMOY,
    nativeId: "80002",
    name: "Polygon Amoy",
    ticker: "MATIC",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/amoy/7a1ffbef35b1400b80a3d8735f637bb3",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  bsc: {
    family: ChainFamily.EVM,
    id: ChainId.BSC,
    nativeId: "56",
    name: "Binance Smart Chain",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc/7c7d3520352d4cf1bba5535ed015851b",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  "bsc-testnet": {
    family: ChainFamily.EVM,
    id: ChainId.BSC_TESTNET,
    nativeId: "97",
    name: "Binance Smart Chain Testnet",
    ticker: "BNB",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/bsc-testnet/8d515e6b213f4e02afc42966422eca11",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  linea: {
    family: ChainFamily.EVM,
    id: ChainId.LINEA,
    nativeId: "59144",
    name: "Linea",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/linea/38da1be47d6a45d5aee7e557800e9248",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  "linea-sepolia": {
    family: ChainFamily.EVM,
    id: ChainId.LINEA_SEPOLIA,
    nativeId: "59141",
    name: "Linea Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/linea-sepolia/03ccfd8ae2ec4c75832ade4cc74b2de5",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  avalanche: {
    family: ChainFamily.EVM,
    id: ChainId.AVALANCHE,
    nativeId: "43114",
    name: "Avalanche",
    ticker: "AVAX",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/avalanche/5addb0088d03429eb061d98a104649ab",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  gnosis: {
    family: ChainFamily.EVM,
    id: ChainId.GNOSIS,
    nativeId: "100",
    name: "Gnosis",
    ticker: "xDAI",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis/87598d6b313843f6be61fecc9b874cdd",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  "gnosis-chiado": {
    family: ChainFamily.EVM,
    id: ChainId.GNOSIS_CHIADO,
    nativeId: "10200",
    name: "Gnosis Chiado",
    ticker: "xDAI",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/gnosis-testnet/91e2e32f95864e6891fbe76dc97e57cb",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  moonbeam: {
    family: ChainFamily.EVM,
    id: ChainId.MOONBEAM,
    nativeId: "1284",
    name: "Moonbeam",
    ticker: "GLMR",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonbeam/82196cbf24574538b48c18bb13ffda21",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  moonriver: {
    family: ChainFamily.EVM,
    id: ChainId.MOONRIVER,
    nativeId: "1285",
    name: "Moonriver",
    ticker: "MOVR",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonriver/84a61f509f5e4ae3a9c29ebd7e8fda67",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  moonbase: {
    family: ChainFamily.EVM,
    id: ChainId.MOONBASE,
    nativeId: "1287",
    name: "Moonbase",
    ticker: "DEV",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/moonbase/a4078cfc56ad43d5a5aa557241ddb7bb",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    isTestNet: true,
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  palm: {
    family: ChainFamily.EVM,
    id: ChainId.PALM,
    nativeId: "11297108109",
    name: "Palm ",
    ticker: "PALM",
    decimals: 18,
    backends: {
      nodeURL: "https://palm-mainnet.infura.io/v3/3a961d6501e54add9a41aa53f15de99b",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  mantle: {
    family: ChainFamily.EVM,
    id: ChainId.MANTLE,
    nativeId: "5000",
    name: "Mantle Network",
    ticker: "MNT",
    decimals: 18,
    backends: {
      nodeURL: "https://site1.moralis-nodes.com/mantle/b1bf079880e246da919aa45f441e1cdf",
      explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: [
      ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
      ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    ],
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
    supportedFeatures: [
      ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
      //Issue with EIP-1559 tx on rootstock
      //ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    ],
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
    supportedFeatures: [
      ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
      //Issue with EIP-1559 tx on rootstock
      //ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    ],
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
    supportedFeatures: FEATURES[ChainFamily.BITCOIN],
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
    supportedFeatures: FEATURES[ChainFamily.BITCOIN],
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
    supportedFeatures: FEATURES[ChainFamily.TON],
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
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
    supportedFeatures: FEATURES[ChainFamily.EVM],
  },
  tron: {
    family: ChainFamily.TRON,
    id: ChainId.TRON,
    nativeId: "tron",
    name: "Tron",
    ticker: "TRX",
    decimals: 6,
    backends: {
      nodeURL: "https://api.trongrid.io",
    },
    supportedFeatures: FEATURES[ChainFamily.TRON],
  },
  "defi-kingdoms": {
    family: ChainFamily.EVM,
    id: ChainId.DEFI_KINGDOMS,
    nativeId: "53935",
    name: "DFK L1",
    ticker: "JEWEL",
    decimals: 18,
    backends: {
      nodeURL: "https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc",
      //explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: [
      ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
      ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    ],
  },
  dexalot: {
    family: ChainFamily.EVM,
    id: ChainId.DEXALOT,
    nativeId: "432204",
    name: "Dexalot L1",
    ticker: "ALOT",
    decimals: 18,
    backends: {
      nodeURL: "https://subnets.avax.network/dexalot/mainnet/rpc",
      //explorerURL: "https://deep-index.moralis.io/api",
    },
    supportedFeatures: FEATURES[ChainFamily.EVM],
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
      defaultPubKeyType: "/injective.crypto.v1beta1.ethsecp256k1.PubKey", // should be eth_secp256k1 instead of secp256k1 (see https://docs.injective.network/learn/basic-concepts/accounts/)
      defaultGas: 100000,
      minGasPrice: 700000000,
    },
    supportedFeatures: [
      ChainFeature.READ_ACCOUNT_BALANCES_NATIVE,
      ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE,
    ],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
    supportedFeatures: FEATURES[ChainFamily.COSMOS],
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
  return CHAINS[chainId].supportedFeatures.flatMap((feature) => {
    switch (feature) {
      case ChainFeature.WRITE_TRANSACTION_TYPE_NATIVE:
        return [TransactionMode.TRANSFER];
      case ChainFeature.WRITE_TRANSACTION_TYPE_TOKENS:
        return [TransactionMode.TRANSFER_TOKEN];
      case ChainFeature.WRITE_TRANSACTION_TYPE_STAKING:
        return [
          TransactionMode.DELEGATE,
          TransactionMode.REDELEGATE,
          TransactionMode.UNDELEGATE,
          TransactionMode.CLAIM_REWARDS,
        ];
      default:
        return [];
    }
  });
}

export { CHAINS, CHAINS_PUBLIC, getSupportedTransactionModes };
