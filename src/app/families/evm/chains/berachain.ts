import { defineChain } from "viem";
import { CHAINS } from "~/app/config/chains";
import { Backend, ProviderType } from "~/app/model/types_WIP";

const chain = CHAINS.berachain;
const nodeUrl = String(chain.backends.find((b: Backend) => b.providerType === ProviderType.node)?.url);

export const berachain = defineChain({
  id: Number(chain.nativeId),
  name: chain.name,
  nativeCurrency: { name: chain.ticker, symbol: chain.ticker, decimals: chain.decimals },
  rpcUrls: {
    default: {
      http: [nodeUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "Berachain Explorer",
      url: "https://berascan.com/",
      apiUrl: "",
    },
  },
  testnet: true,
});
