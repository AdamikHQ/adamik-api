import { HELIUS_API_KEY } from "~/app/config/apiKeys";
import {
  ChainId,
  FinalizedTransaction,
  ProviderType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { ThirdPartyProviderError, UserInputError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { getProviderUrls } from "../../common";
import { HeliusTransactionResponse } from "./helius.types";
import { fetchAssetInfo } from "./node";

const HELIUS_API_URL = getProviderUrls(ChainId.SOLANA, ProviderType.helius)[0];

async function fetchTransaction(transactionAddress: string): Promise<FinalizedTransaction> {
  try {
    const url = `${HELIUS_API_URL}/v0/transactions/?api-key=${HELIUS_API_KEY}`;
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

    const parsedTransaction = await heliusTransferToAdamikTransaction(heliusTransaction);

    return { raw: heliusTransaction, parsed: parsedTransaction };
  } catch (error: unknown) {
    throw new ThirdPartyProviderError("Transaction not found");
  }
}

const getSendersAndRecipients = async (heliusTransaction: HeliusTransactionResponse) => {
  if (heliusTransaction.tokenTransfers.length > 0) {
    const token = await fetchAssetInfo(heliusTransaction.tokenTransfers[0].mint);

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

const heliusTransferToAdamikTransaction = async (
  heliusTransaction: HeliusTransactionResponse
): Promise<FinalizedTransaction["parsed"]> => {
  if (heliusTransaction.type === "NFT_MINT") {
    return {
      id: heliusTransaction.signature,
      mode: "unknown",
      state: TransactionState.CONFIRMED,
      fees: { amount: BigInt(heliusTransaction.fee) },
      timestamp: new Date(heliusTransaction.timestamp).getTime(),
      blockHeight: BigInt(heliusTransaction.slot),
      senders: [],
      recipients: [],
    };
  }

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: heliusTransaction.signature,
    mode:
      heliusTransaction.tokenTransfers.length > 0 ? TransactionMode.TRANSFER_TOKEN : TransactionMode.TRANSFER,
    state: heliusTransaction.transactionError ? TransactionState.FAILED : TransactionState.CONFIRMED,
    tokenId:
      heliusTransaction.tokenTransfers.length > 0 ? heliusTransaction.tokenTransfers[0].mint : undefined,
    fees: { amount: BigInt(heliusTransaction.fee) },
    timestamp: new Date(heliusTransaction.timestamp).getTime(),
    blockHeight: BigInt(heliusTransaction.slot),
    ...(await getSendersAndRecipients(heliusTransaction)),
  };

  return parsedTransaction;
};

async function fetchAccountHistory(
  accountAddress: string,
  paginationToken?: string
): Promise<{ transactions: FinalizedTransaction[]; nextPage: string | null }> {
  let url: string;
  if (paginationToken) {
    const pagination = paginationFromB64(paginationToken);

    url = `${HELIUS_API_URL}/v0/addresses/${accountAddress}/transactions/?api-key=${HELIUS_API_KEY}&before=${pagination}`;
  } else {
    url = `${HELIUS_API_URL}/v0/addresses/${accountAddress}/transactions/?api-key=${HELIUS_API_KEY}`;
  }

  const response = await fetch(url);
  const data = (await response.json()) as HeliusTransactionResponse[];

  return {
    transactions: await Promise.all(
      data.map(async (heliusTransaction) => {
        return {
          raw: heliusTransaction,
          parsed: await heliusTransferToAdamikTransaction(heliusTransaction),
        };
      })
    ),
    nextPage: data.length > 0 ? paginationToB64(data[data.length - 1].signature) : null,
  };
}

export { fetchAccountHistory, fetchTransaction };
