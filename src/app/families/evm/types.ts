type EvmAddress = `0x${string}`;

// Params that differ for each EVM chain
type EvmParams = {
  // The native EVM chain-id value for this chain,
  // not to be confused with our Adamik `ChainId`.
  // Value can be found at https://chainlist.org/
  evmChainId: number;
  // Is it a L2 chain with specific logic regarding fees?
  isL2Fees?: boolean;
};

export type { EvmAddress, EvmParams };
