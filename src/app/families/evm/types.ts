type EvmAddress = `0x${string}`;

// Params that differ for each EVM chain
type EvmParams = {
  // The native chain-id value for this chain (Not needed at this point)
  //evmChainId: string;
  // Is it a L2 chain with specific logic regarding fees?
  isL2Fees?: boolean;
};

export type { EvmAddress, EvmParams };
