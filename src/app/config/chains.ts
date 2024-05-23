import { ChainId, Chain, ChainParams } from "../model/types_WIP";

const CHAINS: Record<ChainId, Chain<ChainParams>> = {
  algorand: {
    id: ChainId.ALGORAND,
    family: "algorand",
    name: "Algorand",
    unit: {
      id: "algo",
      tag: "ALGO",
      decimals: 6,
    },
    backends: {
      nodeURL: "https://algorand.coin.ledger.com/ps2/v2",
      explorerURL: "https://algorand.coin.ledger.com/idx2/v2",
    },
  },
  cosmoshub: {
    id: ChainId.COSMOSHUB,
    family: "cosmos",
    name: "CosmosHub",
    unit: {
      id: "atom",
      tag: "ATOM",
      decimals: 6,
    },
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
    unit: {
      id: "atom",
      tag: "ATOM",
      decimals: 6,
    },
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
    unit: {
      id: "osmo",
      tag: "OSMO",
      decimals: 6,
    },
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
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
    backends: {
      nodeURL: "https://ethereum-rpc.publicnode.com",
      explorerURL: "https://api.etherscan.io/api",
    },
  },
  sepolia: {
    id: ChainId.SEPOLIA,
    family: "evm",
    name: "Sepolia",
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
    backends: {
      nodeURL: "https://ethereum-sepolia-rpc.publicnode.com",
      explorerURL: "https://api-sepolia.etherscan.io/api",
    },
  },
  holesky: {
    id: ChainId.HOLESKY,
    family: "evm",
    name: "Holesky",
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
    backends: {
      nodeURL: "https://ethereum-holesky-rpc.publicnode.com",
      explorerURL: "https://api-holesky.etherscan.io/api",
    },
  },
  zksync: {
    id: ChainId.ZKSYNC,
    family: "evm",
    name: "ZkSync",
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
    backends: {
      nodeURL: "https://zksync-mainnet.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      //explorerURL: TODO,
    },
  },
  "zksync-sepolia": {
    id: ChainId.ZKSYNC_SEPOLIA,
    family: "evm",
    name: "ZkSync Testnet",
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
    backends: {
      nodeURL: "https://zksync-sepolia.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      //explorerURL: TODO,
    },
  },
  "injective-testnet": {
    id: ChainId.INJECTIVE_TESTNET,
    family: "evm",
    name: "Injective",
    unit: {
      id: "inj",
      tag: "INJ",
      decimals: 18,
    },
    backends: {
      nodeURL: "https://testnet.rpc.inevm.com/http",
      //explorerURL: TODO,
    },
  },
  base: {
    id: ChainId.BASE,
    family: "evm",
    name: "Base",
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
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
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
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
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
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
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
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
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
    backends: {
      nodeURL: "https://arbitrum-one.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      explorerURL: "https://api.arbiscan.io/api",
    },
  },
  "arbitrum-sepolia": {
    id: ChainId.ARBITRUM_SEPOLIA,
    family: "evm",
    name: "Arbitrum Sepolia",
    unit: {
      id: "ether",
      tag: "ETH",
      decimals: 18,
    },
    backends: {
      nodeURL: "https://arbitrum-sepolia.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
      explorerURL: "https://api-sepolia.arbiscan.io/api",
    },
  },
};

export { CHAINS };
