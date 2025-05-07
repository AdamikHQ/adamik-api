import { defineChain } from "viem";
import { CHAINS } from "~/app/config/chains";
import { ProviderType } from "~/app/model/types_WIP";
import { getProviderUrls } from "../../common";

const chain = CHAINS.berachain;
const nodeUrl = getProviderUrls(chain.id, ProviderType.node)[0];

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
