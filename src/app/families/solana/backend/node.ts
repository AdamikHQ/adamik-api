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
  StakeProgram,
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

const getConnection = (chainId: ChainId) => {
  const nodeUrl = getProviderUrls(chainId, ProviderType.node)[0] + `?api-key=${HELIUS_API_KEY}`;
  const connection = new Connection(nodeUrl);

  return {
    connection,
    nodeUrl,
  };
};

async function fetchNativeBalance(chainId: ChainId, accountAddress: string) {
  const { connection, nodeUrl } = getConnection(chainId);

  try {
    const wallet = new PublicKey(accountAddress);
    const balance = await connection.getBalance(wallet);
    return { balance: BigInt(balance), assetAmounts: [] };
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while fetching account for ${ChainId.SOLANA}`);
  }
}

async function fetchAccountInfo(chainId: ChainId, accountAddress: string) {
  const { connection, nodeUrl } = getConnection(chainId);
  const account = await connection.getParsedAccountInfo(new PublicKey(accountAddress));
  return account;
}

async function broadcastTransaction(chainId: ChainId, rawData: string): Promise<string> {
  const { connection, nodeUrl } = getConnection(chainId);

  try {
    const txHash = await connection.sendRawTransaction(Buffer.from(rawData, "hex"));
    return txHash;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while broadcasting transaction for ${ChainId.SOLANA}`);
  }
}

async function fetchLatestBlockhash(chainId: ChainId): Promise<string> {
  const { connection, nodeUrl } = getConnection(chainId);

  try {
    const latestBlockhash = await connection.getLatestBlockhash();
    return latestBlockhash.blockhash;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while fetching latest blockhash for ${ChainId.SOLANA}`);
  }
}

async function simulateTransaction(
  chainId: ChainId,
  transaction: VersionedTransaction
): Promise<number | undefined> {
  const { connection, nodeUrl } = getConnection(chainId);
  try {
    const simulationResponse = await connection.simulateTransaction(transaction);
    return simulationResponse.value.unitsConsumed;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while simulating transaction for ${ChainId.SOLANA}`);
  }
}

async function fetchFeeForMessage(chainId: ChainId, transactionMessage: MessageV0): Promise<number | null> {
  const { connection, nodeUrl } = getConnection(chainId);

  try {
    const fees = await connection.getFeeForMessage(transactionMessage);
    return fees.value;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while getting fee for message for ${ChainId.SOLANA}`);
  }
}

async function fetchAccountSPL(chainId: ChainId, accountAddress: string): Promise<SolanaAccount | null> {
  const { connection, nodeUrl } = getConnection(chainId);
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

async function fetchEstimatedFeeFromNode(
  chainId: ChainId,
  transaction: SolanaTransaction
): Promise<number | null> {
  const { connection, nodeUrl } = getConnection(chainId);

  try {
    const estimatedFee = await transaction.getEstimatedFee(connection);
    return estimatedFee;
  } catch (error) {
    console.warn(`/!\\ Error received from ${ChainId.SOLANA} node endpoint ${nodeUrl}:`, error);
    throw new ThirdPartyProviderError(`Error while getting estimated fee from node for ${ChainId.SOLANA}`);
  }
}

async function fetchAccountTokenBalance(
  chainId: ChainId,
  accountAddress: string,
  tokenId: string
): Promise<bigint> {
  const { connection, nodeUrl } = getConnection(chainId);

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
  chainId: ChainId,
  accountAddress: string,
  paginationToken?: string
): Promise<{ tokenAmounts: TokenAmount[]; nextPaginationToken: string | null }> {
  const { connection, nodeUrl } = getConnection(chainId);

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
    const tokens = await fetchAssetsByOwner(chainId, accountAddress, page, limit);

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
  chainId: ChainId,
  accountAddress: string,
  page: number,
  limit: number
): Promise<HeliusTokensResponse> {
  const { nodeUrl } = getConnection(chainId);
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

async function fetchAssetInfo(chainId: ChainId, assetId: string): Promise<Token | null> {
  const { nodeUrl } = getConnection(chainId);
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

async function fetchStakePositions(chainId: ChainId, senderPk: PublicKey): Promise<StakingPosition[]> {
  const { connection, nodeUrl } = getConnection(chainId);
  // Get all accounts owned by the Stake Program
  try {
    const stakeAccountAddresses = await connection.getProgramAccounts(StakeProgram.programId, {
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

        const stakeDelegationData = stakeInfoData.parsed.info.stake.delegation;

        stakePositions.push({
          validatorAddresses: [stakeDelegationData.voter],
          amount: BigInt(stakeDelegationData.stake),
          status:
            BigInt(currentEpoch) > BigInt(stakeDelegationData.deactivationEpoch)
              ? StakingStatus.UNLOCKED
              : BigInt(currentEpoch) <= BigInt(stakeDelegationData.activationEpoch)
              ? StakingStatus.PENDING
              : BigInt(currentEpoch) === BigInt(stakeDelegationData.deactivationEpoch) &&
                stakeDelegationData.deactivationEpoch !== "18446744073709551615" // seems to be max value for epoch
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
  fetchAccountInfo,
  fetchAccountSPL,
  fetchAccountTokenBalance,
  fetchAccountTokensBalance,
  fetchAssetInfo,
  fetchEstimatedFeeFromNode,
  fetchFeeForMessage,
  fetchLatestBlockhash,
  fetchNativeBalance,
  fetchStakePositions,
  simulateTransaction,
};
