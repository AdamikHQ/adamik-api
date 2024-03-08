// Everything here must match types on server side (with serialized inner types)
// TODO Extract in a separate "types" lib? Or some protobuf generation?...

type Unit = {
  name: string;
  code: string;
  decimals: number;
};

type Chain = {
  id: string;
  name: string;
  family: string;
  units: Unit[];
  params?: ChainParams;
};

type ChainParams = CosmosParams;

type CosmosParams = {
  prefix: string;
  defaultPubKeyType: string;
  defaultGas: number;
  minGasPrice: number;
};

export type { Chain, ChainParams };
