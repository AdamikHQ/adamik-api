import { BaseChainService } from "~/app/model/service";
import { ChainFamily, ChainId } from "~/app/model/types_WIP";
import { AlgorandService } from "../families/algorand/service";
import { AptosService } from "../families/aptos/service";
import { BitcoinService } from "../families/bitcoin/service";
import { CosmosService } from "../families/cosmos/service";
import { EvmService } from "../families/evm/service";
import { SolanaService } from "../families/solana/service";
import { StarknetService } from "../families/starknet/service";
import { StellarService } from "../families/stellar/service";
import { TonService } from "../families/ton/service";
import { TronService } from "../families/tron/service";
import { CHAINS } from "./chains";

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
      return new BitcoinService(chainId);
    case ChainFamily.TON:
      return new TonService(chainId);
    case ChainFamily.TRON:
      return new TronService(chainId);
    case ChainFamily.STARKNET:
      return new StarknetService(chainId);
    case ChainFamily.SOLANA:
      return new SolanaService(chainId);
    case ChainFamily.APTOS:
      return new AptosService(chainId);
    case ChainFamily.STELLAR:
      return new StellarService(chainId);
    default: // ensure exhaustive check, both at compile time and runtime: https://basarat.gitbook.io/typescript/type-system/discriminated-unions#exhaustive-checks
      const assertNever = (x: never): never => {
        throw new Error(`No service defined for family ${family}`);
      };
      return assertNever(family);
  }
}

export { getService };
