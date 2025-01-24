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

const blockScoutFeatures: Partial<ChainSupportedFeatures> = {
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

export class Blockscout implements DataSourceInterface {
  url: string;
  supportedFeatures: Partial<Record<ChainId, Partial<ChainSupportedFeatures>>>;

  constructor(url: string) {
    this.url = url;
    this.supportedFeatures = {
      [ChainId.ETHEREUM]: blockScoutFeatures,
    };
  }

  fetchWithAuth(input: URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers();
    if (input.username && input.password) {
      const credentials = Buffer.from(`${input.username}:${input.password}`);
      headers.append("Authorization", `Basic ${credentials.toString("base64")}`);
    }
    return fetch(`${input.origin}${input.pathname}`, {
      ...init,
      headers,
    });
  }

  async getTokenDetails(chainId: ChainId, tokenId: string): Promise<Token> {
    const request = await this.fetchWithAuth(new URL(`${this.url}/api/v2/tokens/${tokenId}`));
    const response = await request.json();
    return {
      type: TokenType.ERC20,
      id: tokenId,
      name: response.name,
      ticker: response.symbol,
      decimals: parseInt(response.decimals),
      contractAddress: tokenId,
      logo: response.icon_url ?? undefined,
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
