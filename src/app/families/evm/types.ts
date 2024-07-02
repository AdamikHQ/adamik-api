// Params that exist only for EVM chains
type EvmChainParams = {
  // Is it a L2 chain with specific logic regarding fees?
  isL2Fees?: boolean;
};

type EvmAddress = `0x${string}`;

export type { EvmChainParams, EvmAddress };
