import { CHAINS } from "~/app/config/chains";
import { ChainId, Provider, ProviderType, Token, TokenType } from "~/app/model/types_WIP";
import {
  CoinData,
  CoinInfosResponse,
  IndexerResponse,
  TransactionsResponse,
} from "~/app/families/aptos/types";
import { TokenStore } from "~/app/tools/tokenStore";

const indexerUrl = String(
  CHAINS.aptos.providers.find((p: Provider) => p.type === ProviderType.aptosindexer)?.url
);

async function indexerRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(indexerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = (await response.json()) as IndexerResponse<T>;
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

export async function getCoinData(chainId: ChainId, coinType: string): Promise<Token> {
  const query = `
    query CoinMetadata($type: String!) {
      coin_infos(where: { coin_type: { _eq: $type } }) {
        name
        symbol
        decimals
        coin_type
        supply_aggregator_table_handle
      }
    }
  `;
  const coinInfosResponse = await indexerRequest<CoinInfosResponse>(query, {
    type: coinType,
  });
  if (coinInfosResponse.coin_infos.length === 0) {
    throw new Error(`No metadata found for coin ${coinType} on chain ${chainId}`);
  }
  const coin = coinInfosResponse.coin_infos[0];
  // We asssume that if this method was called, the token was not already in the TokenStore
  const token = {
    type: TokenType.APTOS_COIN,
    id: coinType,
    name: coin.name,
    ticker: coin.symbol,
    decimals: coin.decimals,
  };
  await TokenStore.save(chainId, [token]);
  return token;
}
