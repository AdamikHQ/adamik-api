// Params that differ for each cosmos chain
type CosmosParams = {
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
};

export type { CosmosParams };
