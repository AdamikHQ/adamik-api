import { defineChain } from "viem";

export const hyperliquid = defineChain({
  id: 999,
  name: "Hyperliquid",
  nativeCurrency: {
    decimals: 18,
    name: "HYPE",
    symbol: "HYPE",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
  },
  blockExplorers: {
    default: {
      name: "HyperEVM Scan",
      url: "https://hyperevmscan.io",
    },
    etherscan: {
      name: "HyperEVM Scan",
      url: "https://hyperevmscan.io",
    },
    parsec: {
      name: "Parsec",
      url: "https://purrsec.com",
    },
    blockscout: {
      name: "HyperScan",
      url: "https://www.hyperscan.com",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 1,
    },
  },
});
