import z from "zod";

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

// Cosmos-specific fields to provide when creating Cosmos chains transactions
type CosmosTransactionParams =
  | {
      // Public key of the sender address, necessary when it never made a transaction yet
      pubKey?: string;
    }
  | undefined; // undefined is for type safety, since the data will be coming from requests

const cosmosTransactionParamsSchema = z.object({
  pubKey: z.string().optional(),
});

type IBCToken = {
  denom: string;
  type: string;
  symbol: string;
  decimals: number;
};

export { cosmosTransactionParamsSchema };
export type { CosmosChainParams, CosmosTransactionParams, IBCToken };
