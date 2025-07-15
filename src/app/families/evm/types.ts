// Params that exist only for EVM chains
type EvmChainParams =
  | {
      // Is it a L2 chain with specific logic regarding fees?
      isL2Fees?: boolean;
    }
  | undefined; // undefined is for type safety, since the data will be coming from requests

type HexString = `0x${string}`;
type EvmAddress = HexString;

export type { EvmAddress, EvmChainParams, HexString };
