// TODO
import { defineChain } from "viem";

export const defiKingdoms = defineChain({
  id: 53935,
  name: "DFK L1",
  nativeCurrency: { name: "JEWEL", symbol: "JEWEL", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc"],
    },
  },
  /*
  blockExplorers: {
    default: {
      name: "Testnet Chiliscan",
      url: "https://testnet.chiliscan.com/",
      apiUrl: "",
    },
  },
  */
  testnet: true,
});
