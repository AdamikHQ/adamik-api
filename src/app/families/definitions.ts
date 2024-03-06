import { ChainId, Chain } from "../model/types_WIP";

const chains: Record<ChainId, Chain> = {
  algorand: {
    id: ChainId.ALGORAND,
    name: "Algorand",
    family: "algorand",
    ticker: "ALGO",
    magnitude: 6,
  },
  cosmos: {
    id: ChainId.COSMOS,
    name: "Cosmos",
    family: "cosmos",
    ticker: "ATOM",
    magnitude: 6,
  },
};

export { chains };
