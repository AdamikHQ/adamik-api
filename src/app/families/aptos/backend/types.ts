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
