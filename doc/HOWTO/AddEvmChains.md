# How to support a new EVM chain in the [evm](https://github.com/AdamikHQ/adamik/tree/main/src/app/families/evm) family

## Chain definition

1. In [/src/app/model/types_WIP.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/model/types_WIP.ts): add your chain in the `ChainId` enum.

2. In [/src/app/config/chains.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/config/chains.ts): add a new item in `CHAINS` with the following settings:\
   (**without** the comments :pray: )

```
  YOUR_CHAIN_ID: {
    id: ChainId.YOUR_CHAIN_ID,
    family: ChainFamily.EVM,
    name: "YOUR CHAIN NAME", // Full name can be found at https://chainlist.org
    ticker: "YOUR CHAIN TICKER", // Ticker can be found at https://chainlist.org, as "Currency"
    decimals: 18, // Decimals should be 18 for all EVM chains
    backends: {
      // Moralis node, if supported: see https://docs.moralis.io/public-rpc-node-endpoints
      // Public node otherwise: see https://chainlist.org
      nodeURL: xxx,
      // Moralis explorer (current default):
      explorerURL: "https://deep-index.moralis.io/api",
    },
    // Refer to EvmParams in https://github.com/AdamikHQ/adamik/blob/main/src/app/families/evm/types.ts
    // for the following EVM-specific parameters
    params: {
      evmChainId: YOUR CHAIN'S chain-id, // Evm native chain-id can be found at https://chainlist.org
      isL2Fees: true, // Default is false, should be set to true only for L2 chains with specific fees management (Optimism, Base...)
    },
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

## Moralis explorer

Moralis is currently the default and only explorer we use for all of our supported EVM chains.\
(_Note: an Etherscan-based implementation also exists but isn't used, and in the future we'll likely support different implementations together_)

Same as Viem, it uses its own IDs to identify chains, so we need a mapping with our Adamik `ChainId`.

1. Find your chain's ID at Moralis:
   - Check the reference doc of the endpoint we use: https://docs.moralis.io/web3-data-api/evm/reference/wallet-api/get-wallet-token-balances-price
   - Valid IDs are listed in the `chain` query param's drop-down menu
2. If you don't find your chain there, it means it isn't supported by Moralis - nothing else to do
3. If you found your chain, then in [/src/app/families/evm/backend/moralis.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/families/evm/backend/moralis.ts) update `MORALIS_CHAIN_IDS` with Adamik's ChainId and the Moralis ID
