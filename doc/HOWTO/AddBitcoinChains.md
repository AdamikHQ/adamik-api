# How to support a new Bitcoin chain in the [bitcoin](https://github.com/AdamikHQ/adamik/tree/main/src/app/families/bitcoin) family

## Chain definition

1. In [/src/app/model/types_WIP.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/model/types_WIP.ts): add your chain in the `ChainId` enum.

2. In [/src/app/config/chains.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/config/chains.ts): add a new item in `CHAINS` with the following settings:\
   (**without** the comments :pray: )

```
  YOUR_CHAIN_ID: {
    family: ChainFamily.BITCOIN,
    id: ChainId.YOUR_CHAIN_ID,
    nativeId: YOUR CHAIN'S native chain-id, // Irrelevant for bitcoin chains, can be the same as the id
    name: "YOUR CHAIN NAME",
    ticker: "YOUR CHAIN TICKER",
    decimals: 8, // 8 for most chains, change if needed
    backends: {
      // Unused for now
      nodeURL: "",
      // Blockchair IDs can be found at https://blockchair.com/api/docs#link_M01
      explorerURL: "https://api.blockchair.com/BLOCKCHAIR_CHAIN_ID",
    },
    // Refer to BitcoinChainParams in https://github.com/AdamikHQ/adamik/blob/main/src/app/families/bitcoin/types.ts
    // for the following Bitcoin-specific parameters
    params: {
      confirmations: 60, // Change if needed, depending on chain's standards
    },
    supportedFeatures: BITCOIN_FEATURES
  },
```

## Chain-specific parameters

In [/src/app/families/bitcoin/logic.ts](https://github.com/AdamikHQ/adamik/blob/main/src/app/families/bitcoin/logic.ts), in the `getNetworkForChainId` function add the following:

```
case ChainId.YOUR_CHAIN_ID:
  return {
    messagePrefix: "\YOUR CHAIN NAME Signed Message:\n",
    bech32: "nbtc", // WARNING: bech32 is often not used, it's just to satisfy the interface
    bip32: {
      public: 0x00000000, // To change
      private: 0x00000000, // To change
    },
    pubKeyHash: 0x00, // To change
    scriptHash: 0x00, // To change
    wif: 0x00, // To change
  };
```

Easiest way to find the right values is to look for other implementations, bitcoinjs for example used to support a lot of different networks.
