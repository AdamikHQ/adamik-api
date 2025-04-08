import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  Connection,
  MessageV0,
  PublicKey,
  Transaction as SolanaTransaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { CHAINS } from "~/app/config/chains";
import { ChainId, ProviderType, Token, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { nonNullable } from "~/app/tools/guard";
import { InvalidPaginationTokenError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { TokenStore } from "~/app/tools/tokenStore";
import { HeliusAssetResponse, HeliusTokensResponse } from "./indexer.types";

const provider = CHAINS.solana.providers.find((p) => p.type === ProviderType.node);
if (!provider) {
  throw new Error("No provider found");
}

const nodeUrl = provider.url;
const connection = new Connection(nodeUrl);

async function fetchAccount(accountAddress: string) {
  const wallet = new PublicKey(accountAddress);
  const balance = await connection.getBalance(wallet);
  return { balance: BigInt(balance), assetAmounts: [] };
}

async function broadcastTransaction(rawData: string): Promise<string> {
  const txHash = await connection.sendRawTransaction(Buffer.from(rawData, "hex"));
  return txHash;
}

async function getLatestBlockhash(): Promise<string> {
  const latestBlockhash = await connection.getLatestBlockhash();
  return latestBlockhash.blockhash;
}

async function simulateTransaction(transaction: VersionedTransaction): Promise<number | undefined> {
  const simulationResponse = await connection.simulateTransaction(transaction);
  return simulationResponse.value.unitsConsumed;
}

async function getFeeForMessage(transactionMessage: MessageV0): Promise<number | null> {
  const fees = await connection.getFeeForMessage(transactionMessage);
  return fees.value;
}

async function getAccountSPL(accountAddress: string) {
  const account = await getAccount(connection, new PublicKey(accountAddress));
  return account;
}

async function getEstimatedFeeFromNode(transaction: SolanaTransaction): Promise<number | null> {
  const estimatedFee = await transaction.getEstimatedFee(connection);
  return estimatedFee;
}

async function getAccountTokenBalance(accountAddress: string, tokenId: string): Promise<bigint | null> {
  const accountPk = new PublicKey(accountAddress);
  const tokenIdPk = new PublicKey(tokenId);
  const tokenAccountAddress = getAssociatedTokenAddressSync(tokenIdPk, accountPk);

  const account = await getAccount(connection, tokenAccountAddress);
  return account.amount;
}

async function fetchAccountTokensBalance(
  accountAddress: string,
  paginationToken?: string
): Promise<{ tokenAmounts: TokenAmount[]; nextPaginationToken: string | null }> {
  let paginationData: { page: number; limit: number } | undefined;
  if (paginationToken) {
    paginationData = paginationFromB64(paginationToken) as { page: number; limit: number };

    if (!paginationData.limit || !paginationData.page) {
      throw new InvalidPaginationTokenError("Provided Token is not valid");
    }
  }

  const limit = paginationData?.limit || 1000;
  const page = paginationData?.page || 1;
  const tokens = await getAssetsByOwner(accountAddress, page, limit);

  if (tokens.result.items.length === 0) {
    return { tokenAmounts: [], nextPaginationToken: null };
  }

  const tokenAmounts: TokenAmount[] = tokens.result.items
    .map<TokenAmount | null>((item) => {
      if (item.interface !== "FungibleToken") {
        return null;
      }
      return {
        token: {
          type: TokenType.SPL,
          id: item.id,
          name: item.content.metadata.name ?? "",
          decimals: item.token_info.decimals,
          ticker: item.content.metadata.symbol ?? "",
        },
        amount: BigInt(item.token_info.balance),
      };
    })
    .filter(nonNullable);

  if (tokens.result.total === limit) {
    const nextPaginationToken = paginationToB64({ page: page + 1, limit });
    return { tokenAmounts, nextPaginationToken };
  }

  return { tokenAmounts, nextPaginationToken: null };
}

// I'm not 100% sure if this method can be used in any RPC provider. Need to check.
// If it's a custom method from Helius API.
async function getAssetsByOwner(
  accountAddress: string,
  page: number,
  limit: number
): Promise<HeliusTokensResponse> {
  const response = await fetch(nodeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 2,
      jsonrpc: "2.0",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: accountAddress,
        page: page,
        limit: limit,
        sortBy: {
          sortBy: "created",
          sortDirection: "asc",
        },
        options: {
          showUnverifiedCollections: false,
          showCollectionMetadata: true,
          showGrandTotal: true,
          showFungible: true,
          showNativeBalance: false,
          showInscription: true,
          showZeroBalance: true,
        },
      },
    }),
  });
  const data = await response.json();

  return data;
}

async function fetchAssetInfo(assetId: string): Promise<Token | null> {
  let [token] = await TokenStore.load(ChainId.SOLANA, [assetId]);
  if (token !== null) {
    return token;
  }

  const response = await fetch(nodeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 2,
      jsonrpc: "2.0",
      method: "getAsset",
      params: { id: assetId },
    }),
  });
  const data: HeliusAssetResponse = await response.json();

  if (!data.result || data.result.interface !== "FungibleToken") {
    return null;
  }

  const assetInfo = data;

  token = {
    type: TokenType.SPL,
    id: assetId,
    name: assetInfo.result.content.metadata.name ?? "",
    ticker: assetInfo.result.content.metadata.symbol ?? "",
    decimals: assetInfo.result.token_info.decimals,
  };

  await TokenStore.save(ChainId.SOLANA, [token]);

  return token;
}

export {
  broadcastTransaction,
  fetchAccount,
  fetchAccountTokensBalance,
  fetchAssetInfo,
  getAccountSPL,
  getAccountTokenBalance,
  getEstimatedFeeFromNode,
  getFeeForMessage,
  getLatestBlockhash,
  simulateTransaction,
};
