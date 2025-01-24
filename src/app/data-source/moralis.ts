import { DataSourceInterface } from "~/app/data-source/data-source-interface";
import {
  AccountHistory,
  AccountState,
  AccountTokens,
  ChainId,
  ChainSupportedFeatures,
  ChainValidators,
  FinalizedTransaction,
  Paginated,
  Token,
} from "../model/types_WIP";
import { fetchERC20Token } from "~/app/families/evm/backend/moralis";
import { EvmAddress } from "~/app/families/evm/types";

const moralisFeatures: Partial<ChainSupportedFeatures> = {
  read: {
    token: true,
    validators: false,
    transaction: {
      native: true,
      tokens: true,
      staking: false,
    },
    account: {
      balances: {
        native: true,
        tokens: true,
        staking: false,
      },
      transactions: {
        native: true,
        tokens: true,
        staking: false,
      },
    },
  },
};

export class Moralis implements DataSourceInterface {
  apiKey: string;
  supportedFeatures: Partial<Record<ChainId, Partial<ChainSupportedFeatures>>>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.supportedFeatures = {
      [ChainId.ETHEREUM]: moralisFeatures,
    };
  }

  getTokenDetails(chainId: ChainId, tokenId: string): Promise<Token> {
    return fetchERC20Token(chainId, tokenId as EvmAddress);
  }
  getChainValidators(chainId: ChainId): Promise<ChainValidators> {
    throw new Error("Method not implemented.");
  }
  getTransactionDetails(chainId: ChainId, transactionId: string): Promise<FinalizedTransaction> {
    throw new Error("Method not implemented.");
  }
  getAccountState(chainId: ChainId, accountId: string): Promise<AccountState> {
    throw new Error("Method not implemented.");
  }
  getAccountTokens(
    chainId: ChainId,
    accountId: string,
    paginationToken?: string
  ): Promise<Paginated<AccountTokens>> {
    throw new Error("Method not implemented.");
  }
  getAccountHistory(chainId: ChainId, accountId: string): Promise<AccountHistory> {
    throw new Error("Method not implemented.");
  }
}
