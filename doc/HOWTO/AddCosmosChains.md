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
    id: ChainId.YOUR_CHAIN_ID,
    family: ChainFamily.COSMOS,
    name: "YOUR CHAIN NAME", // "pretty_name" in chain.json
    ticker: "YOUR CHAIN TICKER", // "symbol" in assetlist.json
    decimals: xxx, // "exponent" for the ticker, in assetlist.json
    backends: {
      // Public nodes are listed in "apis.rest.*" in chain.json
      nodeURL: xxx,
    },
    // Refer to CosmosParams in https://github.com/AdamikHQ/adamik/blob/main/src/app/families/cosmos/types.ts
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
