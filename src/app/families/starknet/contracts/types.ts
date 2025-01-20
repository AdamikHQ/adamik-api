import { BigNumberish, CairoOption, DeployAccountContractTransaction } from "starknet";

import { InvocationsDetailsWithNonce } from "starknet";

export type generateAddress = (pubkey: string) => string;
export type deployContractPayload = (pubkey: string) => Promise<{
  payload: Omit<DeployAccountContractTransaction, "signature"> & {
    toSign: string;
  };
  details: InvocationsDetailsWithNonce;
}>;

export type TimeStamp = { seconds: BigNumberish };

export type StakerPoolInfo = {
  pool_contract: BigNumberish;
  amount: BigNumberish;
  unclaimed_rewards: BigNumberish;
  commission: BigNumberish;
};

export type StakerInfo = {
  reward_address: BigNumberish;
  operational_address: BigNumberish;
  unstake_time: CairoOption<TimeStamp>;
  amount_own: BigNumberish;
  index: BigNumberish;
  unclaimed_rewards_own: BigNumberish;
  pool_info: CairoOption<StakerPoolInfo>;
};
