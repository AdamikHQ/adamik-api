import { ChainFamily, ChainId } from "~/app/model/types_WIP";
import { BaseChainService } from "~/app/model/service";
import { AlgorandService } from "./algorand/service";
import { CosmosService } from "./cosmos/service";
import { EvmService } from "./evm/service";
import { CHAINS } from "../config/chains";

function getService(chainId: ChainId): BaseChainService {
  const family = CHAINS[chainId]?.family;
  switch (family) {
    case ChainFamily.ALGORAND:
      return new AlgorandService(chainId);
    case ChainFamily.COSMOS:
      return new CosmosService(chainId);
    case ChainFamily.EVM:
      return new EvmService(chainId);
  }
}

export { getService };
