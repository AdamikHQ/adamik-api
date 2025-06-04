import {
  getAccount,
  getAssociatedTokenAddressSync,
  Account as SolanaAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from "@solana/spl-token";
import {
  Connection,
  MessageV0,
  PublicKey,
  Transaction as SolanaTransaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { HELIUS_API_KEY } from "~/app/config/apiKeys";
import {
  ChainId,
  ProviderType,
  StakingPosition,
  StakingStatus,
  Token,
  TokenAmount,
  TokenType,
} from "~/app/model/types_WIP";
import { nonNullable } from "~/app/tools/guard";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { TokenStore } from "~/app/tools/tokenStore";
import { getProviderUrls } from "../../common";
import { HeliusAssetResponse, HeliusTokensResponse } from "./helius.types";
import { GetAssetsByOwnerParams, ParsedStakeAccountInfo } from "./node.types";

const nodeUrl = getProviderUrls(ChainId.SOLANA, ProviderType.node)[0] + `?api-key=${HELIUS_API_KEY}`;
const connection = new Connection(nodeUrl);

async function fetchAccount(accountAddress: string) {
  try {
    const wallet = new PublicKey(accountAddress);
    const balance = await connection.getBalance(wallet);
    return { balance: BigInt(balance), assetAmounts: [] };
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while fetching account for ${ChainId.SOLANA}`);
  }
}

async function fetchAccountInfo(accountAddress: string) {
  const account = await connection.getParsedAccountInfo(new PublicKey(accountAddress));
  return account;
}

async function broadcastTransaction(rawData: string): Promise<string> {
  try {
    const txHash = await connection.sendRawTransaction(Buffer.from(rawData, "hex"));
    return txHash;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while broadcasting transaction for ${ChainId.SOLANA}`);
  }
}

async function fetchLatestBlockhash(): Promise<string> {
  try {
    const latestBlockhash = await connection.getLatestBlockhash();
    return latestBlockhash.blockhash;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while fetching latest blockhash for ${ChainId.SOLANA}`);
  }
}

async function simulateTransaction(transaction: VersionedTransaction): Promise<number | undefined> {
  try {
    const simulationResponse = await connection.simulateTransaction(transaction);
    return simulationResponse.value.unitsConsumed;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while simulating transaction for ${ChainId.SOLANA}`);
  }
}

async function fetchFeeForMessage(transactionMessage: MessageV0): Promise<number | null> {
  try {
    const fees = await connection.getFeeForMessage(transactionMessage);
    return fees.value;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while getting fee for message for ${ChainId.SOLANA}`);
  }
}

async function fetchAccountSPL(accountAddress: string): Promise<SolanaAccount | null> {
  try {
    const account = await getAccount(connection, new PublicKey(accountAddress));
    return account;
  } catch (error: unknown) {
    if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
      return null;
    }
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while getting account SPL for ${ChainId.SOLANA}`);
  }
}

async function fetchEstimatedFeeFromNode(transaction: SolanaTransaction): Promise<number | null> {
  try {
    const estimatedFee = await transaction.getEstimatedFee(connection);
    return estimatedFee;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while getting estimated fee from node for ${ChainId.SOLANA}`);
  }
}

async function fetchAccountTokenBalance(accountAddress: string, tokenId: string): Promise<bigint> {
  try {
    const accountPk = new PublicKey(accountAddress);
    const tokenIdPk = new PublicKey(tokenId);
    const tokenAccountAddress = getAssociatedTokenAddressSync(tokenIdPk, accountPk);

    const account = await getAccount(connection, tokenAccountAddress);
    return account.amount;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while getting account token balance for ${ChainId.SOLANA}`);
  }
}

async function fetchAccountTokensBalance(
  accountAddress: string,
  paginationToken?: string
): Promise<{ tokenAmounts: TokenAmount[]; nextPaginationToken: string | null }> {
  try {
    let paginationData: { page: number; limit: number } | undefined;
    if (paginationToken) {
      paginationData = paginationFromB64(paginationToken) as { page: number; limit: number };

      if (!paginationData.limit || !paginationData.page) {
        throw new InvalidPaginationTokenError("Provided Token is not valid");
      }
    }

    const limit = paginationData?.limit || 1000;
    const page = paginationData?.page || 1;
    const tokens = await fetchAssetsByOwner(accountAddress, page, limit);

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
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while fetching account tokens balance for ${ChainId.SOLANA}`);
  }
}

// I'm not 100% sure if this method can be used in any RPC provider. Need to check.
// If it's a custom method from Helius API.
async function fetchAssetsByOwner(
  accountAddress: string,
  page: number,
  limit: number
): Promise<HeliusTokensResponse> {
  const params: GetAssetsByOwnerParams = {
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
  };

  try {
    const response = await fetch(nodeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 2,
        jsonrpc: "2.0",
        method: "getAssetsByOwner",
        params,
      }),
    });
    const data = await response.json();

    return data;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while getting assets by owner for ${ChainId.SOLANA}`);
  }
}

async function fetchAssetInfo(assetId: string): Promise<Token | null> {
  try {
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
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while fetching asset info for ${ChainId.SOLANA}`);
  }
}

async function fetchStakePositions(programId: PublicKey, senderPk: PublicKey): Promise<StakingPosition[]> {
  // Get all accounts owned by the Stake Program
  try {
    const stakeAccountAddresses = await connection.getProgramAccounts(programId, {
      filters: [
        // Filter by stake account structure - look for accounts where
        // the authority (staker or withdrawer) matches our public key
        {
          memcmp: {
            offset: 12, // Offset for authorized staker in the stake account data
            bytes: senderPk.toBase58(),
          },
        },
      ],
      dataSlice: {
        offset: 0,
        length: 0,
      },
    });

    const stakePositions: StakingPosition[] = [];

    const currentEpoch = (await connection.getEpochInfo()).epoch;

    for (const { pubkey } of stakeAccountAddresses) {
      const stakeInfo = await connection.getParsedAccountInfo(new PublicKey(pubkey.toBase58()));

      if (stakeInfo) {
        // We need to cast it because Lib doesn't allow to template the type
        const stakeInfoData = stakeInfo.value?.data as ParsedStakeAccountInfo;

        stakePositions.push({
          validatorAddresses: [stakeInfoData.parsed.info.stake.delegation.voter],
          amount: BigInt(stakeInfoData.parsed.info.stake.delegation.stake),
          status:
            BigInt(currentEpoch) > BigInt(stakeInfoData.parsed.info.stake.delegation.deactivationEpoch)
              ? StakingStatus.UNLOCKED
              : BigInt(currentEpoch) <= BigInt(stakeInfoData.parsed.info.stake.delegation.activationEpoch)
              ? StakingStatus.PENDING
              : BigInt(currentEpoch) ===
                  BigInt(stakeInfoData.parsed.info.stake.delegation.deactivationEpoch) &&
                stakeInfoData.parsed.info.stake.delegation.deactivationEpoch !== "18446744073709551615" // seems to be max value for epoch
              ? StakingStatus.UNLOCKING
              : StakingStatus.LOCKED,
          stakeId: pubkey.toBase58(),
        });
      }
    }

    return stakePositions;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while fetching stake positions for ${ChainId.SOLANA}`);
  }
}

export {
  broadcastTransaction,
  fetchAccount,
  fetchAccountInfo,
  fetchAccountSPL,
  fetchAccountTokenBalance,
  fetchAccountTokensBalance,
  fetchAssetInfo,
  fetchEstimatedFeeFromNode,
  fetchFeeForMessage,
  fetchLatestBlockhash,
  fetchStakePositions,
  simulateTransaction,
};
