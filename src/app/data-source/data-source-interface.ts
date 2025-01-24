import {
  AccountHistory,
  AccountState,
  AccountTokens,
  ChainId,
  FinalizedTransaction,
  Paginated,
  ChainSupportedFeatures,
  ChainValidators,
  Token,
} from "~/app/model/types_WIP";

export interface DataSourceInterface {
  supportedFeatures: Partial<Record<ChainId, Partial<ChainSupportedFeatures>>>;

  getTokenDetails(chainId: ChainId, tokenId: string): Promise<Token>;
  getChainValidators(chainId: ChainId): Promise<ChainValidators>;
  getTransactionDetails(chainId: ChainId, transactionId: string): Promise<FinalizedTransaction>;
  getAccountState(chainId: ChainId, accountId: string): Promise<AccountState>;
  getAccountTokens(
    chainId: ChainId,
    accountId: string,
    paginationToken?: string
  ): Promise<Paginated<AccountTokens>>;
  getAccountHistory(chainId: ChainId, accountId: string): Promise<AccountHistory>;
}
