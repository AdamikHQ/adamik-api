// Everything here must match types on server side (with serialized inner types)
// TODO Extract in a separate "types" lib? Or some protobuf generation?...

type Unit = {
  name: string;
  ticker: string;
  decimals: number;
};

type Chain = {
  family: string;
  id: string;
  nativeId: string;
  name: string;
  unit: Unit;
  params?: ChainParams;
};

type ChainParams = CosmosParams | EvmParams;

type CosmosParams = {
  prefix: string;
  defaultPubKeyType: string;
  defaultGas: number;
  minGasPrice: number;
};

type EvmParams = {
  isL2Fees?: boolean;
};

export type { Chain, ChainParams, CosmosParams, EvmParams };
