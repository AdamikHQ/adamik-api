import { ChainId, ChainService } from "~/app/model/types_WIP";
import { AlgorandService } from "./algorand/service";
import { CosmosService } from "./cosmos/service";

// TODO I don't like the current loose coupling Service <> Chain:
// - it requires to move around a chain.id in almost every function
// - it doesn't prevent to use an incompatible chainID
// Would be good to have a way to set only once the chain used by a service,
// for all its lifetime. Probably needs to define ChainService as a class...
const services: Map<ChainId, ChainService> = new Map([
  [ChainId.ALGORAND, AlgorandService],
  [ChainId.COSMOSHUB, CosmosService],
  [ChainId.OSMOSIS, CosmosService],
]);

export { services };
