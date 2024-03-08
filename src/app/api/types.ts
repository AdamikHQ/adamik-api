import { ChainId, ChainParams } from "../model/types_WIP";

// TODO Unused at the moment, but these should be the models returned
// by the API, instead of the internal models

type ChainResponse = {
  id: ChainId;
  name: string;
  family: string;
  ticker: string;
  decimals: number;
  params?: ChainParams;
};
