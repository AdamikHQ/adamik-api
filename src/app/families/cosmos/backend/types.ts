type CosmosAccount = {
  accountNumber: bigint;
  sequence: bigint;
  pubKeyType: string;
  pubKey: string;
};

type CosmosBalance = {
  denom: string;
  amount: bigint;
};

type COSMOS_STATUS =
  | "BOND_STATUS_UNSPECIFIED"
  | "BOND_STATUS_UNBONDED"
  | "BOND_STATUS_UNBONDING"
  | "BOND_STATUS_BONDED";

/**
 * Naive implementation of Cosmos Validator
 */
export type CosmosValidator = {
  operator_address: string;
  consensus_pubkey: string;
  jailed: boolean;
  status: COSMOS_STATUS;
  tokens: string;
  delegator_shares: string;
  description: {
    moniker: string; //human-readable name for the validator
    identity: string;
    website: string;
    security_contact: string; // security_contact defines an optional email for security contact.
    details: string;
  };
  unbonding_height: string; // unbonding_height defines, if unbonding, the height at which this validator has begun unbonding.
  unbonding_time: string; // unbonding_time defines, if unbonding, the min time for the validator to complete unbonding.
  commission: {
    commission_rates: {
      rate: string;
      max_rate: string;
      max_change_rate: string;
    };
    update_time: string;
  };
  min_self_delegation: string;
};

export type CosmosValidatorResponse = {
  validators: CosmosValidator[];
};

export type { CosmosAccount, CosmosBalance };
