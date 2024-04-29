import { defineChain } from "viem";

export const injectiveTestnet = defineChain({
  id: 2424,
  name: 'inEVM testnet',
  nativeCurrency: { name: 'INJ', symbol: 'INJ', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://testnet.rpc.inevm.com/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'inevm explorer',
      url: 'https://explorer.inevm.com/',
      apiUrl: 'https://inevm.calderaexplorer.xyz/api',
    },
  },
  testnet: true,
})
