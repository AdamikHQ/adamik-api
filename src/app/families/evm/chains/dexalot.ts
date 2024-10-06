// TODO
import { defineChain } from "viem";

export const dexalot = defineChain({
  id: 432204,
  name: "Dexalot L1",
  nativeCurrency: { name: "ALOT", symbol: "ALOT", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://subnets.avax.network/dexalot/mainnet/rpc"],
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
