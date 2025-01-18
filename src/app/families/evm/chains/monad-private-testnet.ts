import { defineChain } from "viem";

export const monadPrivateTestnet = defineChain({
  id: 88882,
  name: "Monad Private Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.monad-testnet.category.xyz/rpc/gw3K5ihInuOcijq3jnRO7JKyo7LmOltg6NZTfL7R"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Private Testnet",
      url: "https://monad.xyz",
      apiUrl: "",
    },
  },
  testnet: true,
});
