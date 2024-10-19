# How to support a new Cosmos chain in the [cosmos](https://github.com/AdamikHQ/adamik/tree/main/src/app/families/cosmos) family

## Chain definition

1. In [/src/app/model/types_WIP.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/model/types_WIP.ts): add your chain in the `ChainId` enum.

2. In [/src/app/config/chains.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/config/chains.ts): add a new item in `CHAINS` with the following settings:\
   (**without** the comments :pray:)

```
  // Most values can be found at:
  // - https://github.com/cosmos/chain-registry/blob/master/[YOUR_CHAIN]/chain.json
  // - https://github.com/cosmos/chain-registry/blob/master/[YOUR_CHAIN]/assetlist.json

  YOUR_CHAIN_ID: {
    family: ChainFamily.COSMOS,
    id: ChainId.YOUR_CHAIN_ID,
    nativeId: YOUR CHAIN'S chain-id, // "chain_id" in chain.json
    name: "YOUR CHAIN NAME", // "pretty_name" in chain.json
    ticker: "YOUR CHAIN TICKER", // "symbol" in assetlist.json
    decimals: xxx, // "exponent" for the ticker, in assetlist.json
    backends: {
      // Public nodes are listed in "apis.rest.*" in chain.json
      // Configs can be checked at: [nodeURL]/cosmos/base/node/v1beta1/config
      // Make sure that the node's config matches the "params" set below
      nodeURL: xxx,
    },
    // Refer to CosmosChainParams in https://github.com/AdamikHQ/adamik/blob/main/src/app/families/cosmos/types.ts
    // for the following Cosmos-specific parameters
    params: {
      prefix: xxx, // "bech32_prefix" in chain.json
      validatorPrefix: xxxvaloper, // Most of the time it's: prefix+"valoper"
      denom: xxx, // "denom" in chain.json
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey", // Should be the same value for all Cosmos chains
      defaultGas: 100000, // Should be the same value for all Cosmos chains
      minGasPrice: xxx, // "average_gas_price" in chain.json
    },
  },
```

## Mintscan explorer

Mintscan is currently the default and only explorer we use for all of our supported Cosmos chains.\

It uses its own IDs to identify chains, so we need a mapping with our Adamik `ChainId`.

1. Find your chain's ID at Mintscan: https://docs.cosmostation.io/apis#cosmos-sdk-based-chains-1
2. If you don't find your chain there, it probably means it isn't supported by Mintscan... you can try probing the mintscan endpoints with your chain ID to make sure, otherwise nothing else to do
3. If you found your chain, then in [/src/app/families/cosmos/backend/mintscan.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/families/cosmos/backend/mintscan.ts) update `MINTSCAN_CHAIN_IDS` with Adamik's ChainId and the Mintscan ID
