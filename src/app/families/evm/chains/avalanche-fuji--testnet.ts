import { defineChain } from "viem";

export const avalancheFujiTesnet = defineChain({
  id: 43113,
  name: "Avalanche Fuji Testnet",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://avalanche-fuji-c-chain-rpc.publicnode.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Avalanche (C-Chain) Testnet",
      url: "https://subnets-test.avax.network/c-chain",
      apiUrl: "",
    },
  },
  testnet: true,
});
