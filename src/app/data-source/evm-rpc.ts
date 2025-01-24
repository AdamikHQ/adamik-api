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
  TokenType,
} from "../model/types_WIP";

import { EvmAddress } from "~/app/families/evm/types";
import { fetchERC20Decimals, fetchERC20name, fetchERC20Ticker } from "~/app/families/evm/backend/node";

const evmRpcFeatures: Partial<ChainSupportedFeatures> = {
  read: {
    token: true,
    validators: false,
    transaction: {
      native: false,
      tokens: false,
      staking: false,
    },
    account: {
      balances: {
        native: true,
        tokens: false,
        staking: false,
      },
      transactions: {
        native: false,
        tokens: false,
        staking: false,
      },
    },
  },
};

export class EvmRpc implements DataSourceInterface {
  url: string;
  supportedFeatures: Partial<Record<ChainId, Partial<ChainSupportedFeatures>>>;

  constructor(url: string) {
    this.url = url;
    this.supportedFeatures = {
      [ChainId.ETHEREUM]: evmRpcFeatures,
    };
  }

  async getTokenDetails(chainId: ChainId, tokenId: string): Promise<Token> {
    const [name, decimals, ticker] = await Promise.all([
      fetchERC20name(chainId, tokenId as EvmAddress),
      fetchERC20Decimals(chainId, tokenId as EvmAddress),
      fetchERC20Ticker(chainId, tokenId as EvmAddress),
    ]);
    return {
      type: TokenType.ERC20,
      id: tokenId,
      name,
      ticker,
      decimals,
      contractAddress: tokenId,
    };
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
