import { AccountRequiresMemoError, Horizon, Transaction as StellarTransaction } from "@stellar/stellar-sdk";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  ProviderType,
  TransactionMode,
  TransactionState,
  type FinalizedTransaction,
} from "~/app/model/types_WIP";
import { amountToSmallestUnit } from "~/app/tools/amount";
import {
  AdamikApiServerError,
  InvalidPaginationTokenError,
  UserInputError,
} from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { BASE_FEE_STROOPS, getStellarNetwork } from "../logic";

function getHorizonServer(chainId: ChainId): Horizon.Server {
  const chain = CHAINS[chainId];
  const horizonUrl =
    chain.providers.find((provider) => provider.type === ProviderType.horizon)?.urls[0] || "";
  return new Horizon.Server(horizonUrl);
}

// For debug
// Horizon.AxiosClient.interceptors.response.use(
//   (response) => {
//     console.log("XXX - Horizon Axios response:", JSON.stringify(response));
//     return response;
//   },
//   (error) => {
//     console.log("XXX - Horizon Axios error:", JSON.stringify(error.response));
//     return error;
//   }
// );

async function fetchRecommendedFee(chainId: ChainId): Promise<number> {
  try {
    const horizonServer = getHorizonServer(chainId);
    const feeStats = await horizonServer.feeStats();
    return Number(feeStats.fee_charged.mode);
  } catch (error: any) {
    console.warn(`/!\\ Failed to fetch fee stats for stellar transaction:`, error);
    // Fall back to the network's default base fee (100 stroops)
    return BASE_FEE_STROOPS;
  }
}

async function fetchAccount(
  chainId: ChainId,
  address: string
): Promise<Horizon.ServerApi.AccountRecord | null> {
  try {
    const horizonServer = getHorizonServer(chainId);
    return await horizonServer.accounts().accountId(address).call();
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }

    console.warn(`/!\\ Failed to fetch Stellar account ${address}:`, error);
    throw new AdamikApiServerError(`Failed to fetch Stellar account ${address}`);
  }
}

/**
 * Fetches transaction details from Horizon server using transaction hash
 * @param transactionHash - The hex-encoded transaction hash
 * @returns Promise<Horizon.TransactionResponse> - The transaction details from Horizon
 */
async function fetchTransaction(
  chainId: ChainId,
  transactionHash: string
): Promise<FinalizedTransaction | null> {
  try {
    const horizonServer = getHorizonServer(chainId);
    const stellarTransaction = await horizonServer.transactions().transaction(transactionHash).call();

    // Remove useless metadata
    delete (stellarTransaction as any)._links;

    const parsed = await stellarToAdamikTransaction(chainId, stellarTransaction);

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
    const horizonServer = getHorizonServer(chainId);
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
        const parsedTransaction = await stellarToAdamikTransaction(chainId, horizonTransaction);

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
  chainId: ChainId,
  horizonTransaction: Horizon.ServerApi.TransactionRecord
): Promise<FinalizedTransaction["parsed"]> {
  const chain = CHAINS[chainId];

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
      case Horizon.HorizonApi.OperationResponseType.createAccount:
        {
          const amount = BigInt(
            amountToSmallestUnit(operation.starting_balance, CHAINS[chainId].decimals) ?? 0
          );

          parsedTransaction.senders?.push({
            address: operation.funder,
            amount,
            ticker: chain.ticker,
          });
          parsedTransaction.recipients?.push({
            address: operation.account,
            amount,
            ticker: chain.ticker,
          });
        }
        break;

      case Horizon.HorizonApi.OperationResponseType.payment:
        {
          const amount = BigInt(amountToSmallestUnit(operation.amount, CHAINS[chainId].decimals) ?? 0);

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
          const sourceAmount = BigInt(
            amountToSmallestUnit(operation.source_amount, CHAINS[chainId].decimals) ?? 0
          );
          const destAmount = BigInt(amountToSmallestUnit(operation.amount, CHAINS[chainId].decimals) ?? 0);

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

      case Horizon.HorizonApi.OperationResponseType.changeTrust:
        {
          // changeTrust operations are used for enabling tokens
          // The source account is the one enabling the token
          if (operation.asset_type === "credit_alphanum4" || operation.asset_type === "credit_alphanum12") {
            parsedTransaction.tokenId = `${operation.asset_code}:${operation.asset_issuer}`;

            // For changeTrust, we only have a sender (the account enabling the token)
            // No amount is transferred, so we set amount to 0
            parsedTransaction.senders?.push({
              address: operation.source_account,
              amount: 0n,
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
    case Horizon.HorizonApi.OperationResponseType.createAccount:
      return TransactionMode.TRANSFER;

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

    case Horizon.HorizonApi.OperationResponseType.changeTrust:
      // changeTrust operations can be either opt-in (positive limit) or opt-out (zero limit)
      // We only support opt-in operations, so check if the trust limit is greater than 0
      if (!firstOperation.limit || firstOperation.limit !== "0") {
        return TransactionMode.ENABLE_TOKEN;
      }
      // If limit is 0, it's an opt-out operation which we don't support
      return "unknown";

    default:
      return "unknown";
  }
}

/**
 * Broadcasts a signed Stellar transaction to the network
 * @param signedTransactionXDR - The XDR-encoded signed transaction
 * @returns Promise<string> - The transaction hash
 */
async function broadcastTransaction(signedTransactionXDR: string, chainId: ChainId): Promise<string> {
  try {
    const networkPassphrase = getStellarNetwork(chainId);
    const horizonServer = getHorizonServer(chainId);

    // Parse the XDR string back to Transaction object
    const transaction = new StellarTransaction(signedTransactionXDR, networkPassphrase);

    // Submit the transaction to the Stellar network
    // FIXME In case of error, for some reason we're only getting generic Axios errors without stellar-specific details
    const result = await horizonServer.submitTransaction(transaction);

    return result.hash;
  } catch (error: any) {
    if (error instanceof AccountRequiresMemoError) {
      throw new UserInputError(`Recipient account requires a memo in the transaction`);
    }

    throw error;
  }
}

export {
  broadcastTransaction,
  fetchAccount,
  fetchAccountTransactions,
  fetchRecommendedFee,
  fetchTransaction,
  stellarToAdamikTransaction,
};
