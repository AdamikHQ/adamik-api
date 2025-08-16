import { Horizon } from "@stellar/stellar-sdk";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  ProviderType,
  TransactionMode,
  TransactionState,
  type FinalizedTransaction,
} from "~/app/model/types_WIP";
import { InvalidPaginationTokenError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { convertToStroops } from "../logic";

// TODO proper error management

const STELLAR_MAINNET_URL =
  CHAINS[ChainId.STELLAR].providers.find((provider) => provider.type === ProviderType.horizon)?.urls[0] || "";

const horizonServer = new Horizon.Server(STELLAR_MAINNET_URL);

async function fetchBaseFee(): Promise<number> {
  try {
    const baseFee = await horizonServer.fetchBaseFee();
    return baseFee;
  } catch (error: any) {
    console.warn(`/!\\ Failed to fetch base fee for stellar transaction: ${error.message}`);
    // Fall back to the network's default base fee (100 stroops)
    return 100;
  }
}

async function fetchAccount(address: string): Promise<Horizon.AccountResponse> {
  try {
    return await horizonServer.loadAccount(address);
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Stellar account not found or not funded: ${address}`);
    }

    if (error.response?.status === 400) {
      throw new Error(`Bad request for Stellar account: ${address}`);
    }

    // Re-throw other errors with context
    throw new Error(`Failed to fetch Stellar account ${address}: ${error.message}`);
  }
}

/**
 * Fetches transaction details from Horizon server using transaction hash
 * @param transactionHash - The hex-encoded transaction hash
 * @returns Promise<Horizon.TransactionResponse> - The transaction details from Horizon
 */
async function fetchTransaction(transactionHash: string): Promise<FinalizedTransaction | null> {
  try {
    const stellarTransaction = await horizonServer.transactions().transaction(transactionHash).call();

    // Remove useless metadata
    delete (stellarTransaction as any)._links;

    const parsed = await stellarToAdamikTransaction(stellarTransaction);

    return {
      parsed,
      raw: stellarTransaction,
    };
  } catch (error: any) {
    // Transaction not found
    if (error?.response?.status === 404) {
      return null;
    }

    // Log other errors and return null instead of throwing
    console.warn(`Failed to fetch Stellar transaction ${transactionHash}: ${error.message}`);
    return null;
  }
}

/**
 * Fetches account transactions from Horizon server with pagination support
 * @param chainId - The chain ID (should be STELLAR)
 * @param address - The Stellar account address
 * @param paginationToken - Optional pagination token for paginated results
 * @returns Promise<{ stellarTransactions: FinalizedTransaction[]; nextPage: string | null }> - The transactions and next page token
 */
async function fetchAccountTransactions(
  chainId: ChainId,
  address: string,
  paginationToken?: string
): Promise<{ stellarTransactions: FinalizedTransaction[]; nextPage: string | null }> {
  try {
    let transactionsQuery = horizonServer.transactions().forAccount(address).limit(20).order("desc");

    if (paginationToken) {
      const paginationData = paginationFromB64(paginationToken);
      if (!paginationData || typeof paginationData !== "string") {
        throw new InvalidPaginationTokenError("Provided pagination token is invalid");
      }
      transactionsQuery = transactionsQuery.cursor(paginationData);
    }

    const response = await transactionsQuery.call();

    const stellarTransactions: FinalizedTransaction[] = [];

    for (const horizonTransaction of response.records) {
      delete (horizonTransaction as any)._links;

      try {
        const parsedTransaction = await stellarToAdamikTransaction(horizonTransaction);

        stellarTransactions.push({
          parsed: parsedTransaction,
          raw: horizonTransaction,
        });
      } catch (error) {
        console.warn(`/!\\ Failed to convert Stellar transaction ${horizonTransaction.hash}:`, error);
        // Continue with other transactions instead of failing completely
        // FIXME We should return a status with a warning for this
        continue;
      }
    }

    // Determine next page token
    let nextPage: string | null = null;
    if (response.records.length === 20) {
      // If we got a full page, there might be more
      const lastTransaction = response.records[response.records.length - 1];
      nextPage = paginationToB64(lastTransaction.paging_token);
    }

    return {
      stellarTransactions,
      nextPage,
    };
  } catch (error: any) {
    // Handle specific Stellar errors
    if (error.response?.status === 404) {
      console.warn(`/!\\ Stellar account not found: ${address}`);
      return { stellarTransactions: [], nextPage: null };
    }

    if (error.response?.status === 400) {
      console.warn(`/!\\ Bad request for Stellar account: ${address}`);
      return { stellarTransactions: [], nextPage: null };
    }

    // Log other errors and return empty result
    console.warn(`/!\\ Failed to fetch Stellar account transactions for ${address}:`, error.message);
    return { stellarTransactions: [], nextPage: null };
  }
}

/**
 * Converts a Horizon transaction response to the Adamik FinalizedTransaction format
 * @param horizonTransaction - The transaction response from Horizon
 * @returns FinalizedTransaction["parsed"] - The parsed transaction data
 */
async function stellarToAdamikTransaction(
  horizonTransaction: Horizon.ServerApi.TransactionRecord
): Promise<FinalizedTransaction["parsed"]> {
  const chain = CHAINS[ChainId.STELLAR];

  // Parse transaction state based on successful status
  const state = horizonTransaction.successful ? TransactionState.CONFIRMED : TransactionState.FAILED;

  // Convert fee from stroops to native amount
  const feesAmount = BigInt(horizonTransaction.fee_charged);

  const operations = await horizonTransaction.operations();

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: horizonTransaction.hash,
    mode: determineTransactionMode(operations),
    state,
    blockHeight: BigInt(horizonTransaction.ledger_attr),
    timestamp: new Date(horizonTransaction.created_at).getTime(),
    fees: {
      amount: feesAmount,
    },
    senders: [],
    recipients: [],
  };

  // Add memo if present
  if (horizonTransaction.memo && horizonTransaction.memo_type !== "none") {
    parsedTransaction.memo = horizonTransaction.memo;
  }

  // Parse operations to determine senders/recipients + token ID
  for (const operation of operations.records) {
    switch (operation.type) {
      case Horizon.HorizonApi.OperationResponseType.payment:
        {
          const amount = convertToStroops(operation.amount);

          if (operation.asset_type === "native") {
            parsedTransaction.senders?.push({
              address: operation.from,
              amount,
              ticker: chain.ticker,
            });
            parsedTransaction.recipients?.push({
              address: operation.to,
              amount,
              ticker: chain.ticker,
            });
          } else if (
            operation.asset_type === "credit_alphanum4" ||
            operation.asset_type === "credit_alphanum12"
          ) {
            parsedTransaction.tokenId = `${operation.asset_code}:${operation.asset_issuer}`;

            parsedTransaction.senders?.push({
              address: operation.from,
              amount,
              ticker: operation.asset_code,
            });
            parsedTransaction.recipients?.push({
              address: operation.to,
              amount,
              ticker: operation.asset_code,
            });
          }
        }
        break;

      case Horizon.HorizonApi.OperationResponseType.pathPayment:
      case Horizon.HorizonApi.OperationResponseType.pathPaymentStrictSend:
        {
          const sourceAmount = convertToStroops(operation.source_amount);
          const destAmount = convertToStroops(operation.amount);

          if (operation.source_asset_type === "native") {
            parsedTransaction.senders?.push({
              address: operation.from,
              amount: sourceAmount,
              ticker: chain.ticker,
            });
            parsedTransaction.recipients?.push({
              address: operation.to,
              amount: destAmount,
              ticker: chain.ticker,
            });
          } else if (
            operation.source_asset_type === "credit_alphanum4" ||
            operation.source_asset_type === "credit_alphanum12"
          ) {
            parsedTransaction.tokenId = `${operation.asset_code}:${operation.asset_issuer}`;

            parsedTransaction.senders?.push({
              address: operation.from,
              amount: sourceAmount,
              ticker: operation.source_asset_code,
            });
            parsedTransaction.recipients?.push({
              address: operation.to,
              amount: destAmount,
              ticker: operation.asset_code,
            });
          }
        }
        break;
    }
  }

  return parsedTransaction;
}

function determineTransactionMode(
  operations: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.OperationRecord>
): TransactionMode | "unknown" {
  if (operations.records.length === 0) {
    return "unknown";
  }

  // Check the first operation to determine transaction mode
  const firstOperation = operations.records[0];

  switch (firstOperation.type) {
    case Horizon.HorizonApi.OperationResponseType.payment:
      // Check if it's a native XLM payment or asset payment
      if (firstOperation.asset_type === "native") {
        return TransactionMode.TRANSFER;
      } else {
        return TransactionMode.TRANSFER_TOKEN;
      }

    case Horizon.HorizonApi.OperationResponseType.pathPayment:
    case Horizon.HorizonApi.OperationResponseType.pathPaymentStrictSend:
      // Path payments involve assets
      // FIXME Is this reliable?
      return TransactionMode.TRANSFER_TOKEN;

    default:
      return "unknown";
  }
}

export { fetchAccount, fetchAccountTransactions, fetchBaseFee, fetchTransaction, stellarToAdamikTransaction };
