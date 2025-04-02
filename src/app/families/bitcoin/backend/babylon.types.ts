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

enum BabylonDelegationState {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  ACTIVE = "ACTIVE",
  SLASHED = "SLASHED",
  TIMELOCK_UNBONDING = "TIMELOCK_UNBONDING",
  EARLY_UNBONDING = "EARLY_UNBONDING",
  TIMELOCK_WITHDRAWABLE = "TIMELOCK_WITHDRAWABLE",
  EARLY_UNBONDING_WITHDRAWABLE = "EARLY_UNBONDING_WITHDRAWABLE",
  TIMELOCK_SLASHING_WITHDRAWABLE = "TIMELOCK_SLASHING_WITHDRAWABLE",
  EARLY_UNBONDING_SLASHING_WITHDRAWABLE = "EARLY_UNBONDING_SLASHING_WITHDRAWABLE",
  TIMELOCK_WITHDRAWN = "TIMELOCK_WITHDRAWN",
  EARLY_UNBONDING_WITHDRAWN = "EARLY_UNBONDING_WITHDRAWN",
  TIMELOCK_SLASHING_WITHDRAWN = "TIMELOCK_SLASHING_WITHDRAWN",
  EARLY_UNBONDING_SLASHING_WITHDRAWN = "EARLY_UNBONDING_SLASHING_WITHDRAWN",
}

const babylonDelegationV2Schema = z.object({
  data: z.object({
    delegation_staking: z.object({
      bbn_inception_height: z.number(),
      bbn_inception_time: z.string(),
      end_height: z.number(),
      slashing: z.object({
        slashing_tx_hex: z.string(),
        spending_height: z.number(),
      }),
      staking_amount: z.number(),
      staking_timelock: z.number(),
      staking_tx_hash_hex: z.string(),
      staking_tx_hex: z.string(),
      start_height: z.number(),
    }),
    delegation_unbonding: z.object({
      covenant_unbonding_signatures: z.array(
        z.object({
          covenant_btc_pk_hex: z.string(),
          signature_hex: z.string(),
        })
      ),
      slashing: z.object({
        spending_height: z.number(),
        unbonding_slashing_tx_hex: z.string(),
      }),
      unbonding_timelock: z.number(),
      unbonding_tx: z.string(),
    }),
    finality_provider_btc_pks_hex: z.array(z.string()),
    params_version: z.number(),
    staker_btc_pk_hex: z.string(),
    state: z.nativeEnum(BabylonDelegationState),
  }),
});

type BabylonDelegationV2 = z.infer<typeof babylonDelegationV2Schema>;

export {
  BabylonDelegationState,
  babylonDelegationV2Schema,
  babylonFinalityProviderV1Schema,
  babylonGlobalParamsV1Schema,
  babylonNetworkInfoV2Schema,
};
export type {
  BabylonDelegationV2,
  BabylonFinalityProviderV1,
  BabylonGlobalParamsV1,
  BabylonUnbondingBroadcastPayloadV1,
};
