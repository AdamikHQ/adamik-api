import { defineChain } from "viem";

export const chilizTestnet = defineChain({
  id: 88882,
  name: "Chiliz Spicy Testnet",
  nativeCurrency: { name: "CHZ", symbol: "CHZ", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://chiliz-spicy.publicnode.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Testnet Chiliscan",
      url: "https://testnet.chiliscan.com/",
      apiUrl: "",
    },
  },
  testnet: true,
});
