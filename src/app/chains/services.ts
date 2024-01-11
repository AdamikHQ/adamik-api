import { ChainId, ChainService } from "~/app/model/types_WIP";
import { AlgorandService } from "./algorand/service";
//import { CosmosService } from "./cosmos/service";

const services: Map<ChainId, ChainService> = new Map([
  [ChainId.ALGORAND, AlgorandService],
  //[ChainId.COSMOS, CosmosService]
]);

export { services };
