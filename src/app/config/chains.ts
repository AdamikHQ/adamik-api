import { ChainId, Chain } from "../model/types_WIP";

const ethereumUnits = (name: string, code: string) => [
  {
    name,
    code,
    decimals: 18,
  },
  {
    name: "Gwei",
    code: "Gwei",
    decimals: 9,
  },
  {
    name: "Mwei",
    code: "Mwei",
    decimals: 6,
  },
  {
    name: "Kwei",
    code: "Kwei",
    decimals: 3,
  },
  {
    name: "wei",
    code: "wei",
    decimals: 0,
  },
];


const CHAINS: Record<ChainId, Chain> = {
  algorand: {
    id: ChainId.ALGORAND,
    family: "algorand",
    name: "Algorand",
    units: [
      {
        name: "ALGO",
        code: "algo",
        decimals: 6,
      },
    ],
    backends: {
      nodeURL: "https://algorand.coin.ledger.com/ps2/v2",
      explorerURL: "https://algorand.coin.ledger.com/idx2/v2",
    },
  },
  cosmoshub: {
    id: ChainId.COSMOSHUB,
    family: "cosmos",
    name: "CosmosHub",
    units: [
      {
        name: "ATOM",
        code: "atom",
        decimals: 6,
      },
      {
        name: "Micro-ATOM",
        code: "uatom",
        decimals: 0,
      },
    ],
    backends: {
      nodeURL: "https://cosmos-rest.publicnode.com",
    },
    params: {
      prefix: "cosmos",
      validatorPrefix: "cosmosvaloper",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  osmosis: {
    id: ChainId.OSMOSIS,
    family: "cosmos",
    name: "Osmosis",
    units: [
      {
        name: "OSMO",
        code: "osmo",
        decimals: 6,
      },
      {
        name: "Micro-OSMO",
        code: "uosmo",
        decimals: 0,
      },
    ],
    backends: {
      nodeURL: "https://g.w.lavanet.xyz:443/gateway/cos3/rest/b18879ccf0bbb32d82c6c6ee02074f8a",
    },
    params: {
      prefix: "osmo",
      validatorPrefix: "osmovaloper",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  "cosmoshub-testnet": {
    id: ChainId.COSMOSHUB_TESTNET,
    family: "cosmos",
    name: "CosmosHub Testnet",
    units: [
      {
        name: "ATOM",
        code: "atom",
        decimals: 6,
      },
      {
        name: "Micro-ATOM",
        code: "uatom",
        decimals: 0,
      },
    ],
    backends: {
      nodeURL: "https://api-t.cosmos.nodestake.top",
    },
    params: {
      prefix: "cosmos",
      validatorPrefix: "cosmosvaloper",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  },
  ethereum: {
    id: ChainId.ETHEREUM,
    family: "ethereum",
    name: "Ethereum",
    units: ethereumUnits("ETH", "ether"),
    backends: {
      nodeURL: "https://ethereum-rpc.publicnode.com",
    },
    params: undefined,
  },
  sepolia: {
    id: ChainId.SEPOLIA,
    family: "ethereum",
    name: "Ethereum",
    units: ethereumUnits("ETH", "ether"),
    backends: {
      nodeURL: "https://ethereum-sepolia-rpc.publicnode.com",
    },
    params: undefined,
  },
  holesky: {
    id: ChainId.HOLESKY,
    family: "ethereum",
    name: "Ethereum",
    units: ethereumUnits("ETH", "ether"),
    backends: {
      nodeURL: "https://ethereum-holesky-rpc.publicnode.com",
    },
    params: undefined,
  },
  zksync: {
    id: ChainId.ZKSYNC,
    family: "ethereum",
    name: "Ethereum",
    units: ethereumUnits("ETH", "ether"),
    backends: {
      nodeURL: "https://zksync-mainnet.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
    },
    params: undefined,
  },
  "zksync-testnet": {
    id: ChainId.ZKSYNC_TESTNET,
    family: "ethereum",
    name: "Ethereum",
    units: ethereumUnits("ETH", "ether"),
    backends: {
      nodeURL: "https://zksync-sepolia.blastapi.io/c4df2f44-6c3f-46b7-8872-733d6e1fc3fa",
    },
    params: undefined,
  }
};

export { CHAINS };
