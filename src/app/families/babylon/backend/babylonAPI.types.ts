import { z } from "zod";

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

type BabylonNetworkInfoV2Schema = z.infer<typeof babylonNetworkInfoV2Schema>;

const babylonFinalityProviderV2Schema = z.object({
  btc_pk: z.string(),
  state: z.string(),
  description: z.object({
    moniker: z.string(),
    identity: z.string(),
    website: z.string(),
    security_contact: z.string(),
    details: z.string(),
  }),
  commission: z.string(),
  active_tvl: z.number(),
  active_delegations: z.number(),
});

type BabylonFinalityProviderV2 = z.infer<typeof babylonFinalityProviderV2Schema>;

enum BabylonFinalityProviderStatus {
  // FINALITY_PROVIDER_STATUS_INACTIVE defines a finality provider that does not have sufficient
  // delegations or does not have timestamped public randomness
  FINALITY_PROVIDER_STATUS_INACTIVE = "FINALITY_PROVIDER_STATUS_INACTIVE",
  // FINALITY_PROVIDER_STATUS_ACTIVE defines a finality provider that have sufficient delegations
  // and have timestamped public randomness
  FINALITY_PROVIDER_STATUS_ACTIVE = "FINALITY_PROVIDER_STATUS_ACTIVE",
  // FINALITY_PROVIDER_STATUS_JAILED defines a finality provider that is jailed due to downtime
  FINALITY_PROVIDER_STATUS_JAILED = "FINALITY_PROVIDER_STATUS_JAILED",
  // FINALITY_PROVIDER_STATUS_SLASHED defines a finality provider that is slashed due to double-sign
  FINALITY_PROVIDER_STATUS_SLASHED = "FINALITY_PROVIDER_STATUS_SLASHED",
}

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
      end_height: z.number().optional(),
      slashing: z.object({
        slashing_tx_hex: z.string(),
        spending_height: z.number(),
      }),
      staking_amount: z.number(),
      staking_timelock: z.number(),
      staking_tx_hash_hex: z.string(),
      staking_tx_hex: z.string(),
      start_height: z.number().optional(),
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
  BabylonFinalityProviderStatus,
  babylonFinalityProviderV2Schema,
  babylonNetworkInfoV2Schema,
};

export type { BabylonDelegationV2, BabylonFinalityProviderV2, BabylonNetworkInfoV2Schema };
