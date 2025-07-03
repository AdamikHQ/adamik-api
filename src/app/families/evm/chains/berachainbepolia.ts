import { defineChain } from "viem";
import { CHAINS } from "~/app/config/chains";
import { ProviderType } from "~/app/model/types_WIP";
import { getProviderUrls } from "../../common";

const chain = CHAINS["berachain-bepolia"];
const nodeUrl = getProviderUrls(chain.id, ProviderType.node)[0];

export const berachainbepolia = defineChain({
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
      name: "Berachain Bepolia Explorer",
      url: "https://testnet.berascan.com/",
      apiUrl: "",
    },
  },
  testnet: true,
});
