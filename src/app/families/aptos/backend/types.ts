import { MoveType } from "@aptos-labs/ts-sdk";

export type AccountResponse = {
  sequence_number: string;
  authentication_key: string;
};

export type CoinBalance = {
  data: {
    coin: {
      value: string;
    };
  };
};

export type GasPriceEstimate = {
  deprioritized_gas_estimate: number;
  gas_estimate: number;
  prioritized_gas_estimate: number;
};

export type AptosStakeResponse = [number, number, number];

export type FungibleAssetBalance = {
  amount: number;
  asset_type: string;
  metadata: {
    token_standard: string;
    symbol: string;
    name: string;
    icon_uri: string;
    decimals: number;
  };
};

export type FungleAssetBalancesResponse = {
  current_fungible_asset_balances: FungibleAssetBalance[];
};

export type AccountDelegation = {
  pool_address: string;
  pool_type: string;
  shares: number;
};

export type AccountDelegationsResponse = {
  current_delegator_balances: AccountDelegation[];
};
