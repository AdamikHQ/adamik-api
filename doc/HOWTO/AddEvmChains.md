# How to support a new EVM chain in the [evm](https://github.com/AdamikHQ/adamik/tree/main/src/app/families/evm) family

## Chain definition

1. In [/src/app/model/types_WIP.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/model/types_WIP.ts): add your chain in the `ChainId` enum.

2. In [/src/app/config/chains.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/config/chains.ts): add a new item in `CHAINS` with the following settings:\
   (**without** the comments :pray: )

```
  YOUR_CHAIN_ID: {
    family: ChainFamily.EVM,
    id: ChainId.YOUR_CHAIN_ID,
    nativeId: YOUR CHAIN'S chain-id, // Evm native chain-id can be found at https://chainlist.org
    name: "YOUR CHAIN NAME", // Full name can be found at https://chainlist.org
    ticker: "YOUR CHAIN TICKER", // Ticker can be found at https://chainlist.org, as "Currency"
    decimals: 18, // Decimals should be 18 for all EVM chains
    providers: [
      {
         type: ProviderType.node,
         urls: [
            "http://rpc-url",
            "http://fallback-rpc-url", // Optional
         ],
      },
      {
         type: ProviderType.moralis, // or ProviderType.alchemy
         urls: [
            "http://indexer-url",
         ]
      }
    ],
    // Refer to EvmChainParams in https://github.com/AdamikHQ/adamik/blob/main/src/app/families/evm/types.ts
    // for the following EVM-specific parameters
    params: {
      isL2Fees: true, // Default is false, should be set to true only for L2 chains with specific fees management (Optimism, Base...)
    },
    supportedFeatures: EVM_FEATURES(ChainId.YOUR_CHAIN_ID),
  },
```

## Viem lib

[Viem](https://viem.sh/) is the library we use to interact with EVM nodes.\
It uses its own IDs to identify chains, so we need a mapping with our Adamik `ChainId`.

In [/src/app/families/evm/backend/node.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/families/evm/backend/node.ts):

1. Check if Viem has a standard definition for your chain at: https://github.com/wevm/viem/blob/main/src/chains/index.ts

- If it does, just import it with the other ones
- If it does not, you can use Viem's `defineChain` function to describe its parameters manually in [/src/app/families/evm/chains/](https://github.com/AdamikHQ/adamik/blob/main/src/app/families/evm/chains) (see [injective-testnet.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/families/evm/chains/injective-testnet.ts) as an exemple)

2. Update the `getClientConfig` function with a `case` to map your ChainId to Viem's

## Indexer configuration

Moralis and Alchemy are currently the only explorers we use for all of our supported EVM chains.\
(_Note: an Etherscan-based implementation also exists but isn't used, and in the future we'll likely support different implementations together_)

Same as Viem, it uses its own IDs to identify chains, so we need a mapping with our Adamik `ChainId`.

1. Find your chain's ID
   - at Moralis:
      - Check the reference doc of the endpoint we use: https://docs.moralis.io/web3-data-api/evm/reference/wallet-api/get-wallet-token-balances-price
      - Valid IDs are listed in the `chain` query param's drop-down menu
   - at Alchemy
     - Log into the Alchemy dashboard and select the Adamik App
     - in the tab "Networks" look for the network you are adding
     - Valid ids are the subdomain in the url https://<chain-name>.g.alchemy.com/v2/... 
2. If you don't find your chain there, it means it isn't supported by Moralis or Alchemy - nothing else to do
3. If you found your chain, then update the relevant `SUPPORTED_CHAIN_IDS` with Adamik's ChainId and the Indexer's ID
   - for Moralis: [/src/app/families/evm/backend/moralis.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/families/evm/backend/moralis.ts)
   - for Alchemy: [/src/app/families/evm/backend/alchemy.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/families/evm/backend/alchemy.ts)
