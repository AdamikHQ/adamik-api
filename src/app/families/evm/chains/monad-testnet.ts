import { defineChain } from "viem";
import { CHAINS } from "~/app/config/chains";
import { ProviderType } from "~/app/model/types_WIP";
import { getProviderUrls } from "../../common";

const chain = CHAINS["monad-testnet"];
const nodeUrl = getProviderUrls(chain.id, ProviderType.node)[0];

export const monadTestnet = defineChain({
  id: 88882,
  name: "Monad Private Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [nodeUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: "https://testnet.monadexplorer.com/",
      apiUrl: "",
    },
  },
  testnet: true,
});
