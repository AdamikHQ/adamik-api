import { CoinInfosResponse, IndexerResponse } from "~/app/families/aptos/types";
import { ChainId, ProviderType, Token, TokenType } from "~/app/model/types_WIP";
import { getProviderUrls } from "../../common";
import {
  AccountDelegationsResponse,
  FungibleAssetBalance,
  FungleAssetBalancesResponse,
} from "~/app/families/aptos/backend/types";

async function indexerRequest<T>(
  chainId: ChainId,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const indexerUrl = getProviderUrls(chainId, ProviderType.aptosindexer)[0];

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
  // GraphQL query to the indexer:  https://aptos.dev/en/build/indexer
  const query = `
    query CoinInfos($type: String!) {
      coin_infos(where: { coin_type: { _eq: $type } }) {
        name
        symbol
        decimals
        coin_type
        supply_aggregator_table_handle
      }
    }
  `;
  const coinInfosResponse = await indexerRequest<CoinInfosResponse>(chainId, query, {
    type: coinType,
  });
  if (coinInfosResponse.coin_infos.length === 0) {
    throw new Error(`No metadata found for coin ${coinType} on chain ${chainId}`);
  }
  const coin = coinInfosResponse.coin_infos[0];
  // We asssume that if this method was called, the token was not already in the TokenStore
  return {
    type: TokenType.APTOS_COIN,
    id: coinType,
    name: coin.name,
    ticker: coin.symbol,
    decimals: coin.decimals,
  };
}
export async function fetchAccountCoins(
  chainId: ChainId,
  address: string,
  tokenId?: string
): Promise<FungibleAssetBalance[]> {
  const coinFilter = tokenId === undefined ? "" : `asset_type: { _eq: $tokenId }`;
  const query = `
    query FungleAssetBalances(
      $address: String,
      $tokenId: String,
    ) {
      current_fungible_asset_balances(where: {
        owner_address: { _eq: $address }
        ${coinFilter}
      }) {
        amount
        asset_type
        is_frozen
        is_primary
        last_transaction_timestamp
        last_transaction_version
        owner_address
        storage_id
        token_standard
        metadata {
          token_standard
          symbol
          supply_aggregator_table_key_v1
          supply_aggregator_table_handle_v1
          project_uri
          name
          last_transaction_version
          last_transaction_timestamp
          icon_uri
          decimals
          creator_address
          asset_type
        }
      }
    }
  `;
  const response = await indexerRequest<FungleAssetBalancesResponse>(chainId, query, {
    address,
    tokenId,
  });
  return response.current_fungible_asset_balances;
}

export async function fetchStakingPositions(chainId: ChainId, address: string) {
  const query = `
    query AccountDelegations($address: String, $limit: Int, $offset: Int) {
      current_delegator_balances(
        where: {
          delegator_address: { _eq: $address }
        }
        limit: $limit,
        offset: $offset
      ) {
        pool_address,
        pool_type,
        shares,
        table_handle,
      }
    }
  `;
  const response = await indexerRequest<AccountDelegationsResponse>(chainId, query, {
    address,
  });
  return response.current_delegator_balances;
}
