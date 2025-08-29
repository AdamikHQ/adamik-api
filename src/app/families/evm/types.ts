import { ChainId, FinalizedTransaction, Token, TokenAmount } from "~/app/model/types_WIP";
import { HarvestParams } from "./backend/stakewise.types";

// Params that exist only for EVM chains
type EvmChainParams =
  | {
      // Is it a L2 chain with specific logic regarding fees?
      isL2Fees?: boolean;
    }
  | undefined; // undefined is for type safety, since the data will be coming from requests

type EvmTransactionParams = {
  stakingShares?: bigint; // StakeWise unstake use-case, for internal use only, not exposed through the API
  stakingTimestamp?: bigint; // StakeWise withdraw use-case, for internal use only, not exposed through the API
  stakingHarvestParams?: HarvestParams; // Stakewise, stake use-case
};

type HexString = `0x${string}`;
type EvmAddress = HexString;

interface EvmIndexer {
  fetchAccountTransactions: (
    c: ChainId,
    a: EvmAddress,
    p?: string
  ) => Promise<{ evmTransactions: Array<FinalizedTransaction>; nextPage: string | null }>;
  fetchAllERC20TokenAmounts: (c: ChainId, a: EvmAddress) => Promise<TokenAmount[]>;
  fetchERC20Token: (c: ChainId, a: EvmAddress) => Promise<Token>;
  fetchERC20TokenAmounts: (
    c: ChainId,
    a: EvmAddress,
    p?: string
  ) => Promise<{ tokens: TokenAmount[]; nextPage: string | null }>;
  fetchTransaction: (c: ChainId, t: string) => Promise<FinalizedTransaction | null>;
}

export type { EvmAddress, EvmChainParams, EvmIndexer, EvmTransactionParams, HexString };
