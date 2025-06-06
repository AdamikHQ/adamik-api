import { HELIUS_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  FinalizedTransaction,
  ProviderType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { amountToSmallestUnit } from "~/app/tools/amount";
import { ThirdPartyProviderError, UserInputError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { getProviderUrls } from "../../common";
import { HeliusTransactionResponse } from "./helius.types";
import { fetchAssetInfo } from "./node";

const getIndexerBaseUrl = (chainId: ChainId) => {
  return getProviderUrls(chainId, ProviderType.helius)[0];
};

async function fetchTransaction(chainId: ChainId, transactionAddress: string): Promise<FinalizedTransaction> {
  const heliusBaseUrl = getIndexerBaseUrl(chainId);

  try {
    const url = `${heliusBaseUrl}/v0/transactions/?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        transactions: [transactionAddress],
      }),
    });

    const data: HeliusTransactionResponse[] = await response.json();

    const heliusTransaction = data[0];

    if (!heliusTransaction) {
      throw new UserInputError("Transaction not found");
    }

    const parsedTransaction = await heliusTransactionToAdamikTransaction(chainId, heliusTransaction);

    return { raw: heliusTransaction, parsed: parsedTransaction };
  } catch (error: unknown) {
    console.warn("Error fetching transaction", error);
    throw new ThirdPartyProviderError("Transaction not found");
  }
}

const extractSolAmount = (text: string): bigint | null => {
  const match = text.match(/(\d+\.?\d*)\s*SOL/);
  if (!match) return null;

  const amount = parseFloat(match[1]);
  return BigInt(amountToSmallestUnit(amount.toString(), CHAINS[ChainId.SOLANA].decimals) ?? 0);
};

const getTransferInfo = async (chainId: ChainId, heliusTransaction: HeliusTransactionResponse) => {
  if (heliusTransaction.tokenTransfers.length > 0) {
    const token = await fetchAssetInfo(chainId, heliusTransaction.tokenTransfers[0].mint);

    if (!token) {
      return {
        senders: [],
        recipients: [],
      };
    }

    return {
      senders: [
        {
          address: heliusTransaction.tokenTransfers[0].fromUserAccount,
          amount: BigInt(heliusTransaction.tokenTransfers[0].tokenAmount * 10 ** token.decimals),
          ticker: token.ticker,
        },
      ],
      recipients: [
        {
          address: heliusTransaction.tokenTransfers[0].toUserAccount,
          amount: BigInt(heliusTransaction.tokenTransfers[0].tokenAmount * 10 ** token.decimals),
          ticker: token.ticker,
        },
      ],
    };
  }

  switch (heliusTransaction.type) {
    case "STAKE_SOL":
      return {
        senders: [
          {
            address: heliusTransaction.nativeTransfers[0].fromUserAccount,
            amount: 0n,
          },
        ],
        recipients: [],
        validators: {
          target: {
            address: heliusTransaction.instructions[0].accounts[0], // TODO: Check if it's always corresponding to validator.
            amount: BigInt(heliusTransaction.nativeTransfers[0].amount),
          },
        },
      };

    case "UNSTAKE_SOL":
      return {
        senders: [
          {
            address: heliusTransaction.accountData[0].account,
            amount: 0n,
          },
        ],
        recipients: [
          {
            address: heliusTransaction.accountData[1].account,
            amount: extractSolAmount(heliusTransaction.description) ?? 0n, // Note: I can only find the amount on description but not on node. Which is impractical.
          },
        ],
      };

    case "WITHDRAW":
      return {
        senders: [
          {
            address: heliusTransaction.accountData[0].account,
            amount: 0n,
          },
        ],
        recipients: [],
        validators: {
          target: {
            address: heliusTransaction.accountData[1].account, // TODO: Check if it's always corresponding to validator.
            amount: 0n,
          },
        },
      };
  }

  if (heliusTransaction.nativeTransfers.length > 0) {
    return {
      senders: [
        {
          address: heliusTransaction.nativeTransfers[0].fromUserAccount,
          amount: BigInt(heliusTransaction.nativeTransfers[0].amount),
        },
      ],
      recipients: [
        {
          address: heliusTransaction.nativeTransfers[0].toUserAccount,
          amount: BigInt(heliusTransaction.nativeTransfers[0].amount),
        },
      ],
    };
  }

  return {
    senders: [],
    recipients: [],
  };
};

const heliusTransactionToAdamikTransaction = async (
  chainId: ChainId,
  heliusTransaction: HeliusTransactionResponse
): Promise<FinalizedTransaction["parsed"]> => {
  if (heliusTransaction.type === "NFT_MINT") {
    return {
      id: heliusTransaction.signature,
      mode: "unknown",
      state: TransactionState.CONFIRMED,
      fees: { amount: BigInt(heliusTransaction.fee) },
      timestamp: new Date(heliusTransaction.timestamp * 1000).getTime(),
      blockHeight: BigInt(heliusTransaction.slot),
      senders: [],
      recipients: [],
    };
  }

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: heliusTransaction.signature,
    mode: await heliusTransactionModeToAdamikMode(heliusTransaction),
    state: heliusTransaction.transactionError ? TransactionState.FAILED : TransactionState.CONFIRMED,
    tokenId:
      heliusTransaction.tokenTransfers.length > 0 ? heliusTransaction.tokenTransfers[0].mint : undefined,
    fees: { amount: BigInt(heliusTransaction.fee) },
    timestamp: new Date(heliusTransaction.timestamp * 1000).getTime(),
    blockHeight: BigInt(heliusTransaction.slot),
    ...(await getTransferInfo(chainId, heliusTransaction)),
  };

  return parsedTransaction;
};

async function heliusTransactionModeToAdamikMode(
  heliusTransaction: HeliusTransactionResponse
): Promise<TransactionMode> {
  if (heliusTransaction.type === "STAKE_SOL") {
    return TransactionMode.STAKE;
  }

  if (heliusTransaction.type === "UNSTAKE_SOL") {
    return TransactionMode.UNSTAKE;
  }

  if (heliusTransaction.type === "WITHDRAW") {
    return TransactionMode.WITHDRAW;
  }

  if (heliusTransaction.tokenTransfers.length > 0) {
    return TransactionMode.TRANSFER_TOKEN;
  }

  return TransactionMode.TRANSFER;
}

async function fetchAccountHistory(
  chainId: ChainId,
  accountAddress: string,
  paginationToken?: string
): Promise<{ transactions: FinalizedTransaction[]; nextPage: string | null }> {
  const heliusBaseUrl = getIndexerBaseUrl(chainId);

  let url: string;
  if (paginationToken) {
    const pagination = paginationFromB64(paginationToken);

    url = `${heliusBaseUrl}/v0/addresses/${accountAddress}/transactions/?api-key=${HELIUS_API_KEY}&before=${pagination}`;
  } else {
    url = `${heliusBaseUrl}/v0/addresses/${accountAddress}/transactions/?api-key=${HELIUS_API_KEY}`;
  }

  const response = await fetch(url);
  const data = (await response.json()) as HeliusTransactionResponse[];

  return {
    transactions: await Promise.all(
      data.map(async (heliusTransaction) => {
        return {
          raw: heliusTransaction,
          parsed: await heliusTransactionToAdamikTransaction(chainId, heliusTransaction),
        };
      })
    ),
    nextPage: data.length > 0 ? paginationToB64(data[data.length - 1].signature) : null,
  };
}

export { fetchAccountHistory, fetchTransaction };
