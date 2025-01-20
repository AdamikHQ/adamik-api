// Params that exist only for cosmos chains
type CosmosChainParams = {
  // Prefix of addresses
  prefix: string;
  // Prefix of validator addresses
  validatorPrefix?: string;
  // Unit used when querying the node
  denom: string;
  // Necessary when building transaction payloads
  defaultPubKeyType: string;
  // May differ between chains
  defaultGas: number;
  // May differ between chains
  minGasPrice: number;
  // ICS chains rely on the cosmoshub chain for some features (eg. validators)
  isICS?: boolean;
};

type IBCToken = {
  denom: string;
  type: string;
  symbol: string;
  decimals: number;
};

export type { CosmosChainParams, IBCToken };
