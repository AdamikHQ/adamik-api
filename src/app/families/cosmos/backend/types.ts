type CosmosAccount = {
  accountNumber: bigint;
  sequence: bigint;
  pubKeyType: string;
  pubKey: string;
};

type CosmosBalance = {
  denom: string;
  amount: string;
};

type CosmosDelegation = {
  balance: CosmosBalance;
  delegation: {
    delegator_address: string;
    validator_address: string;
    shares: number;
  };
};

type CosmosRedelegation = {
  redelegation: {
    delegator_address: string;
    validator_src_address: string;
    validator_dst_address: string;
    entries:
      | {
          creation_height: string;
          completion_time: string;
          initial_balance: string;
          shares_dst: string;
        }[]
      // null since sdk 0.46
      | null;
  };
  entries: {
    redelegation_entry: {
      creation_height: string;
      completion_time: string;
      initial_balance: string;
      shares_dst: string;
      // only since sdk 0.46
      unbonding_id?: string;
    };
    balance: string;
  }[];
};

type CosmosUnbondingDelegation = {
  delegator_address: string;
  validator_address: string;
  entries: {
    creation_height: string;
    completion_time: string;
    initial_balance: string;
    balance: string;
    unbonding_id: string;
    unbonding_on_hold_ref_count: string;
  }[];
};

type CosmosReward = {
  validator_address: string;
  reward: CosmosBalance[];
};

type CosmosRewards = {
  rewards: CosmosReward[];
  total: CosmosBalance[];
};

type COSMOS_STAKING_STATUS =
  | "BOND_STATUS_UNSPECIFIED"
  | "BOND_STATUS_UNBONDED"
  | "BOND_STATUS_UNBONDING"
  | "BOND_STATUS_BONDED";

type CosmosValidator = {
  operator_address: string;
  consensus_pubkey: string;
  jailed: boolean;
  status: COSMOS_STAKING_STATUS;
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

export type {
  CosmosAccount,
  CosmosBalance,
  CosmosDelegation,
  CosmosRedelegation,
  CosmosUnbondingDelegation,
  CosmosRewards,
  CosmosValidator,
};
