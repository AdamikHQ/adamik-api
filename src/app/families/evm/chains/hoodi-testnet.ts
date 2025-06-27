import { defineChain, http } from "viem";

export const hoodiTestnet = defineChain({
  id: 560048,
  name: "Hoodi",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://ethereum-hoodi-rpc.publicnode.com"],
    },
  },
  transport: http(),
});
