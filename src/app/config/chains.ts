import { ChainId, Chain, ChainParams } from "../model/types_WIP";

const CHAINS: Record<ChainId, Chain<ChainParams>> = {
  algorand: {
    id: ChainId.ALGORAND,
    family: "algorand",
    name: "Algorand",
    ticker: "ALGO",
    decimals: 6,
    backends: {
      nodeURL: "https://mainnet-idx.algonode.cloud/v2",
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
      nodeURL: "https://ethereum-rpc.publicnode.com",
      explorerURL: "https://api.etherscan.io/api",
    },
  },
  sepolia: {
    id: ChainId.SEPOLIA,
    family: "evm",
    name: "Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://ethereum-sepolia-rpc.publicnode.com",
      explorerURL: "https://api-sepolia.etherscan.io/api",
    },
  },
  holesky: {
    id: ChainId.HOLESKY,
    family: "evm",
    name: "Holesky",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://ethereum-holesky-rpc.publicnode.com",
      explorerURL: "https://api-holesky.etherscan.io/api",
    },
  },
  zksync: {
    id: ChainId.ZKSYNC,
    family: "evm",
    name: "ZkSync",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://zksync-mainnet.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      explorerURL: "https://zksync.blockscout.com/api",
    },
  },
  "zksync-sepolia": {
    id: ChainId.ZKSYNC_SEPOLIA,
    family: "evm",
    name: "ZkSync Testnet",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://zksync-sepolia.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      explorerURL: "https://zksync.blockscout.com/api",
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
  },
  base: {
    id: ChainId.BASE,
    family: "evm",
    name: "Base",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://base-mainnet.g.alchemy.com/v2/rOq_ClcjzdlIKQh-h6sMTBW9MhVBf94Z",
      explorerURL: "https://api.basescan.org/api",
    },
    params: {
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
      nodeURL: "https://sepolia.base.org",
      explorerURL: "https://api.basescan.org/api",
    },
    params: {
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
      nodeURL: "https://opt-mainnet.g.alchemy.com/v2/pDuVOEX6OCaN6lq_xILoecc3lcFXuyTz",
      explorerURL: "https://api-optimistic.etherscan.io/api",
    },
    params: {
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
      nodeURL: "https://opt-sepolia.g.alchemy.com/v2/6dtfsgvoSwhyPVqp0_nvAWJ40CbiOqQ8",
      explorerURL: "https://api-sepolia-optimistic.etherscan.io/api",
    },
    params: {
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
      nodeURL: "https://arbitrum-one.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      explorerURL: "https://api.arbiscan.io/api",
    },
  },
  "arbitrum-sepolia": {
    id: ChainId.ARBITRUM_SEPOLIA,
    family: "evm",
    name: "Arbitrum Sepolia",
    ticker: "ETH",
    decimals: 18,
    backends: {
      nodeURL: "https://arbitrum-sepolia.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      explorerURL: "https://api-sepolia.arbiscan.io/api",
    },
  },
};

export { CHAINS };
