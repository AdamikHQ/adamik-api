import {
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  Transaction as StellarTransaction,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { BigNumber } from "bignumber.js";
import { CHAINS } from "~/app/config/chains";
import { ChainId, TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { UnsupportedFeatureError, UserInputError } from "~/app/tools/handlers/errors";
import { fetchAccount, fetchBaseFee } from "./backend/horizon";

// Base reserve is 0.5 XLM per entry, minimum 2 entries required
const BASE_RESERVE_STROOPS = 5000000; // 0.5 XLM in stroops (7 decimals)
const BASE_RESERVE_MIN_COUNT = 2;
const MIN_BALANCE_STROOPS = BASE_RESERVE_MIN_COUNT * BASE_RESERVE_STROOPS; // 1 XLM minimum in stroops

/**
 * Validates a Stellar address using the official Stellar SDK.
 * Stellar addresses are Ed25519 public keys encoded in base32 with a CRC16 checksum.
 * Valid addresses start with 'G' for regular accounts.
 *
 * @param address - The address string to validate
 * @returns boolean - true if the address is valid, false otherwise
 */
function isValidAddress(address: string): boolean {
  try {
    // Use Stellar SDK's built-in validation for Ed25519 public keys
    return StrKey.isValidEd25519PublicKey(address);
  } catch (error) {
    return false;
  }
}

function convertToStroops(xlmBalance: string): bigint {
  const chain = CHAINS[ChainId.STELLAR];
  return BigInt(Math.floor(parseFloat(xlmBalance) * Math.pow(10, chain.decimals)));
}

function getAccountMinimumBalance(account: Horizon.ServerApi.AccountRecord | null): bigint {
  const numOfEntries = account?.subentry_count || 0;

  const numOfSponsoringEntries = account?.num_sponsoring || 0;
  const numOfSponsoredEntries = account?.num_sponsored || 0;

  const nativeAsset = account?.balances?.find((b) => b.asset_type === "native");
  const amountInOffers = convertToStroops(nativeAsset?.selling_liabilities || "0");

  return (
    BigInt(
      BASE_RESERVE_STROOPS *
        (BASE_RESERVE_MIN_COUNT + numOfEntries + numOfSponsoringEntries - numOfSponsoredEntries)
    ) + amountInOffers
  );
}

/**
 * Calculates the maximum spendable amount for a Stellar account
 * @param account - The account response from Horizon
 * @returns bigint - The maximum spendable amount in stroops
 */
function calculateMaxSpendable(account: Horizon.ServerApi.AccountRecord | null): bigint {
  // Find the native XLM balance
  const xlmBalance = account?.balances.find((balance) => balance.asset_type === "native");
  if (!xlmBalance) {
    return 0n;
  }

  const totalBalance = convertToStroops(xlmBalance.balance);

  const minBalance = getAccountMinimumBalance(account);

  // Maximum spendable is total balance minus minimum required balance
  const maxSpendable = totalBalance - minBalance;

  return maxSpendable > 0n ? maxSpendable : 0n;
}

/**
 * Calculates the maximum spendable amount for a specific token
 * @param account - The account response from Horizon
 * @param tokenId - The token ID in format "asset_code:asset_issuer"
 * @returns bigint - The maximum spendable token amount in stroops
 */
function calculateMaxSpendableToken(
  account: Horizon.ServerApi.AccountRecord | null,
  tokenId: string
): bigint {
  const [assetCode, assetIssuer] = tokenId.split(":");

  // Find the specific token balance
  const tokenBalance = account?.balances.find(
    (balance) =>
      (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === assetCode &&
      balance.asset_issuer === assetIssuer
  );

  return tokenBalance ? convertToStroops(tokenBalance.balance) : 0n;
}

/**
 * Calculates the transaction fee based on the transaction data and base fee
 * @param transactionData - The transaction data
 * @param baseFee - The base fee in stroops
 * @returns bigint - The total transaction fee in stroops
 */
async function calculateTransactionFee(transactionData: TransactionData): Promise<bigint> {
  const baseFee = await fetchBaseFee();

  // For Stellar, the fee is calculated as: number_of_operations * base_fee
  // Most basic transactions have 1 operation
  let operationCount: number | undefined = undefined;
  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.TRANSFER_TOKEN:
    case TransactionMode.ENABLE_TOKEN:
      operationCount = 1;
      break;
    default:
      throw new UnsupportedFeatureError(
        `Transaction mode ${transactionData.mode} is not supported for chainId stellar`
      );
  }

  return BigInt(operationCount * baseFee);
}

/**
 * Builds a Stellar transaction using the Stellar SDK
 * @param transactionData - The transaction data
 * @returns Promise<Transaction> - The built transaction
 */
async function buildTransaction(transactionData: TransactionData): Promise<StellarTransaction> {
  const chain = CHAINS[ChainId.STELLAR];

  const senderAccount = await fetchAccount(transactionData.senderAddress);
  if (!senderAccount) {
    throw new UserInputError(`Stellar account ${transactionData.senderAddress} doesn't exist`);
  }

  const senderHorizonAccount = new Horizon.AccountResponse(senderAccount);
  const transactionBuilder = new TransactionBuilder(senderHorizonAccount, {
    fee: transactionData.fees!.toString(),
    networkPassphrase: Networks.PUBLIC,
  });

  const asset = "tokenId" in transactionData ? getStellarAsset(transactionData.tokenId) : Asset.native();

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
      {
        const amount = new BigNumber(transactionData.amount!.toString())
          .dividedBy(Math.pow(10, chain.decimals))
          .toFixed();

        // Check if recipient account exists
        const recipientAccount = await fetchAccount(transactionData.recipientAddress);

        if (!recipientAccount) {
          // If recipient doesn't exist, create account with starting balance
          transactionBuilder.addOperation(
            Operation.createAccount({
              destination: transactionData.recipientAddress,
              startingBalance: amount,
            })
          );
        } else {
          // If recipient exists, send payment
          transactionBuilder.addOperation(
            Operation.payment({
              destination: transactionData.recipientAddress,
              asset,
              amount,
            })
          );
        }
      }
      break;

    case TransactionMode.TRANSFER_TOKEN:
      {
        const amount = new BigNumber(transactionData.amount!.toString())
          .dividedBy(Math.pow(10, chain.decimals))
          .toFixed();

        transactionBuilder.addOperation(
          Operation.payment({
            destination: transactionData.recipientAddress,
            asset,
            amount,
          })
        );
      }
      break;

    case TransactionMode.ENABLE_TOKEN:
      {
        transactionBuilder.addOperation(
          Operation.changeTrust({
            asset,
          })
        );
      }
      break;

    default:
      throw new UnsupportedFeatureError(
        `Transaction mode ${transactionData.mode} is not supported for chainId stellar`
      );
  }

  if (transactionData.memo) {
    transactionBuilder.addMemo(Memo.text(transactionData.memo));
  }

  // Arbitrary 10 minutes timeout
  const transaction = transactionBuilder.setTimeout(600).build();

  return transaction;
}

function getStellarAsset(tokenId: string): Asset {
  const [assetCode, assetIssuer] = tokenId.split(":") || [];
  if (!assetCode || !assetIssuer || !isValidAddress(assetIssuer)) {
    throw new UserInputError(`Invalid token ID ${tokenId}`);
  }

  return new Asset(assetCode, assetIssuer);
}

export {
  BASE_RESERVE_STROOPS,
  buildTransaction,
  calculateMaxSpendable,
  calculateMaxSpendableToken,
  calculateTransactionFee,
  convertToStroops,
  getStellarAsset,
  isValidAddress,
  MIN_BALANCE_STROOPS,
};
