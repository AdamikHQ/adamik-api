import { ChainFamily, ChainId } from "~/app/model/types_WIP";
import { BaseChainService } from "~/app/model/service";
import { AlgorandService } from "./algorand/service";
import { CosmosService } from "./cosmos/service";
import { EvmService } from "./evm/service";
import { BtcService } from "./bitcoin/service";
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
    case ChainFamily.BITCOIN:
      return new BtcService(chainId);
    default: // ensure exhaustive check, both at compile time and runtime: https://basarat.gitbook.io/typescript/type-system/discriminated-unions#exhaustive-checks
      const assertNever = (x: never): never => {
        throw new Error(`No service defined for family ${family}`);
      }
      return assertNever(family);
  }
}

export { getService };
