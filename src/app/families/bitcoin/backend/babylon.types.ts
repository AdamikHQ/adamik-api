import { z } from "zod";

// V1 (shouldn't be useful, to be removed soon) ////////////////////////////////////////

const babylonGlobalParamsV1Schema = z.object({
  activation_height: z.number(),
  cap_height: z.number(),
  confirmation_depth: z.number(),
  covenant_pks: z.string().array(),
  covenant_quorum: z.number(),
  max_staking_amount: z.number(),
  max_staking_time: z.number(),
  min_staking_amount: z.number(),
  min_staking_time: z.number(),
  staking_cap: z.number(),
  tag: z.string(),
  unbonding_fee: z.number(),
  unbonding_time: z.number(),
  version: z.number(),
});

type BabylonGlobalParamsV1 = z.infer<typeof babylonGlobalParamsV1Schema>;

const babylonFinalityProviderV1Schema = z.object({
  active_delegations: z.number(),
  active_tvl: z.number(),
  btc_pk: z.string(),
  total_delegations: z.number().optional(),
  total_tvl: z.number().optional(),
  commission: z.string(),
  description: z.object({
    details: z.string(),
    identity: z.string(),
    moniker: z.string(),
    security_contact: z.string(),
    website: z.string(),
  }),
});

type BabylonFinalityProviderV1 = z.infer<typeof babylonFinalityProviderV1Schema>;

type BabylonUnbondingBroadcastPayloadV1 = {
  staker_signed_signature_hex: string;
  staking_tx_hash_hex: string;
  unbonding_tx_hash_hex: string;
  unbonding_tx_hex: string;
};

// V2 ////////////////////////////////////////

const babylonNetworkInfoV2Schema = z.object({
  allow_list_expiration_height: z.number(),
  btc_activation_height: z.number(),
  covenant_pks: z.string().array(),
  covenant_quorum: z.number(),
  delegation_creation_base_gas_fee: z.number(),
  max_active_finality_providers: z.number(),
  max_staking_time_blocks: z.number(),
  max_staking_value_sat: z.number(),
  min_commission_rate: z.string(),
  min_slashing_tx_fee_sat: z.number(),
  min_staking_time_blocks: z.number(),
  min_staking_value_sat: z.number(),
  slashing_pk_script: z.string(),
  slashing_rate: z.string(),
  unbonding_fee_sat: z.number(),
  unbonding_time_blocks: z.number(),
  version: z.number(),
});

type BabylonNetworkInfoV2 = z.infer<typeof babylonNetworkInfoV2Schema>;

export { babylonFinalityProviderV1Schema, babylonGlobalParamsV1Schema, babylonNetworkInfoV2Schema };
export type {
  BabylonFinalityProviderV1,
  BabylonGlobalParamsV1,
  BabylonNetworkInfoV2,
  BabylonUnbondingBroadcastPayloadV1,
};
