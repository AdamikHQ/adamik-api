import { Horizon } from "@stellar/stellar-sdk";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  ProviderType,
  TokenType,
  TransactionMode,
  TransactionState,
  type AccountState,
  type FinalizedTransaction,
  type Token,
  type TokenAmount,
} from "~/app/model/types_WIP";
import { convertToStroops } from "../logic";

// TODO proper error management

// Stellar server configuration
const STELLAR_MAINNET_URL =
  CHAINS[ChainId.STELLAR].providers.find((provider) => provider.type === ProviderType.horizon)?.urls[0] || "";

// Initialize Stellar server for mainnet
const horizonServer = new Horizon.Server(STELLAR_MAINNET_URL);

async function fetchAccount(address: string): Promise<AccountState> {
  const chain = CHAINS[ChainId.STELLAR];
  const account: Horizon.AccountResponse = await (async () => {
    try {
      return await horizonServer.loadAccount(address);
    } catch (error: any) {
      // Handle specific Stellar errors
      if (error.response?.status === 404) {
        throw new Error(`Stellar account not found or not funded: ${address}`);
      }

      if (error.response?.status === 400) {
        throw new Error(`Bad request for Stellar account: ${address}`);
      }

      // Re-throw other errors with context
      throw new Error(`Failed to fetch Stellar account ${address}: ${error.message}`);
    }
  })();

  // Extract native XLM balance
  const xlmBalance = account.balances.find((balance) => balance.asset_type === "native");

  // Extract tokens balances (non-native assets)
  const assetBalances = account.balances.filter(
    (balance) =>
      // Asset types from https://github.com/stellar/js-stellar-base/blob/1904c4791eab93f94c3e9bea4a1c44323c585a8c/types/index.d.ts#L54
      balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12"
  );

  const xlmBalanceInStroops = xlmBalance ? convertToStroops(xlmBalance.balance) : BigInt(0);

  const tokens: TokenAmount[] = assetBalances.map((assetData: Horizon.HorizonApi.BalanceLineAsset) => {
    const token: Token = {
      type: TokenType.STELLAR_ASSET,
      // FIXME Review this
      id: `${assetData.asset_code}:${assetData.asset_issuer}`,
      name: assetData.asset_code,
      ticker: assetData.asset_code,
      decimals: chain.decimals,
      contractAddress: assetData.asset_issuer,
    };

    return {
      token,
      amount: convertToStroops(assetData.balance),
    };
  });

  // Map to AccountState structure
  return {
    balances: {
      native: {
        available: xlmBalanceInStroops,
        total: xlmBalanceInStroops,
      },
      tokens,
    },
  };
}

/**
 * Fetches transaction details from Horizon server using transaction hash
 * @param transactionHash - The hex-encoded transaction hash
 * @returns Promise<Horizon.TransactionResponse> - The transaction details from Horizon
 */
async function fetchTransaction(
  transactionHash: string
): Promise<Horizon.ServerApi.TransactionRecord | null> {
  try {
    const transactionRecord = await horizonServer.transactions().transaction(transactionHash).call();
    // Remove useless metadata
    delete (transactionRecord as any)._links;
    return transactionRecord;
  } catch (error: any) {
    // Handle specific Horizon errors
    if (error.response?.status === 404 || error.response?.status === 400) {
      return null;
    }

    // Log other errors and return null instead of throwing
    console.warn(`Failed to fetch Stellar transaction ${transactionHash}: ${error.message}`);
    return null;
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

  // TODO Debug this, check the data structure
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
            // FIXME Is that the right tokenId syntax?
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
            // FIXME Is that the right tokenId syntax?
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

// TODO Test this with different transactions
function parseOperations(
  operations: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.OperationRecord>
): Partial<FinalizedTransaction["parsed"]> {
  const chain = CHAINS[ChainId.STELLAR];

  const parsedOperations: Partial<FinalizedTransaction["parsed"]> = {
    senders: [],
    recipients: [],
  };

  for (const operation of operations.records) {
    switch (operation.type) {
      case Horizon.HorizonApi.OperationResponseType.payment:
        {
          const amount = convertToStroops(operation.amount);

          if (operation.asset_type === "native") {
            parsedOperations.senders?.push({
              address: operation.from,
              amount,
              ticker: chain.ticker,
            });
            parsedOperations.recipients?.push({
              address: operation.to,
              amount,
              ticker: chain.ticker,
            });
          } else if (
            operation.asset_type === "credit_alphanum4" ||
            operation.asset_type === "credit_alphanum12"
          ) {
            // FIXME Is that the right tokenId syntax?
            parsedOperations.tokenId = `${operation.asset_code}:${operation.asset_issuer}`;

            parsedOperations.senders?.push({
              address: operation.from,
              amount,
              ticker: operation.asset_code,
            });
            parsedOperations.recipients?.push({
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
            parsedOperations.senders?.push({
              address: operation.from,
              amount: sourceAmount,
              ticker: chain.ticker,
            });
            parsedOperations.recipients?.push({
              address: operation.to,
              amount: destAmount,
              ticker: chain.ticker,
            });
          } else if (
            operation.source_asset_type === "credit_alphanum4" ||
            operation.source_asset_type === "credit_alphanum12"
          ) {
            // FIXME Is that the right tokenId syntax?
            parsedOperations.tokenId = `${operation.asset_code}:${operation.asset_issuer}`;

            parsedOperations.senders?.push({
              address: operation.from,
              amount: sourceAmount,
              ticker: operation.source_asset_code,
            });
            parsedOperations.recipients?.push({
              address: operation.to,
              amount: destAmount,
              ticker: operation.asset_code,
            });
          }
        }
        break;
    }
  }

  return parsedOperations;
}

export { fetchAccount, fetchTransaction, stellarToAdamikTransaction };
