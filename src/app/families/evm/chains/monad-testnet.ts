import { defineChain } from "viem";
import { CHAINS } from "~/app/config/chains";
import { Backend, ProviderType } from "~/app/model/types_WIP";

const chain = CHAINS["monad-testnet"];
const nodeUrl = String(chain.backends.find((b: Backend) => b.providerType === ProviderType.node)?.url);

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
