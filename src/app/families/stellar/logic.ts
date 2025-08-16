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

/**
 * Calculates the maximum spendable amount for a Stellar account
 * @param account - The account response from Horizon
 * @returns bigint - The maximum spendable amount in stroops
 */
function calculateMaxSpendable(account: Horizon.AccountResponse): bigint {
  const chain = CHAINS[ChainId.STELLAR];

  // Find the native XLM balance
  const xlmBalance = account.balances.find((balance) => balance.asset_type === "native");
  if (!xlmBalance) {
    return BigInt(0);
  }

  const totalBalance = convertToStroops(xlmBalance.balance);

  // Calculate minimum balance requirement
  // Base reserve is 0.5 XLM per entry
  // Minimum balance = (2 + number of subentries) * base reserve
  const baseReserve = BigInt(0.5 * Math.pow(10, chain.decimals)); // 0.5 XLM in stroops
  const minBalance = (2n + BigInt(account.subentry_count || 0)) * baseReserve;

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
function calculateMaxSpendableToken(account: Horizon.AccountResponse, tokenId: string): bigint {
  const [assetCode, assetIssuer] = tokenId.split(":");

  // Find the specific token balance
  const tokenBalance = account.balances.find(
    (balance) =>
      (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === assetCode &&
      balance.asset_issuer === assetIssuer
  );

  if (!tokenBalance) {
    return BigInt(0);
  }

  return convertToStroops(tokenBalance.balance);
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
  let operationCount = 1;

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.TRANSFER_TOKEN:
      // Basic transfer transactions have 1 operation (payment)
      return BigInt(operationCount * baseFee);
    /*
    // TODO
    case TransactionMode.OPT_IN_TOKEN:
      // Opt-in transactions have 1 operation (changeTrust)
      return BigInt(operationCount * baseFee);
    */
    default:
      throw new UnsupportedFeatureError(
        `Transaction mode ${transactionData.mode} is not supported for chainId stellar`
      );
  }
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

  const transactionBuilder = new TransactionBuilder(senderAccount, {
    fee: transactionData.fees!.toString(),
    networkPassphrase: Networks.PUBLIC,
  });

  const amount = new BigNumber(transactionData.amount!.toString())
    .dividedBy(Math.pow(10, chain.decimals))
    .toFixed();

  const asset = (() => {
    if (transactionData.mode === TransactionMode.TRANSFER_TOKEN) {
      const [assetCode, assetIssuer] = transactionData.tokenId.split(":");
      return new Asset(assetCode, assetIssuer);
    } else {
      return Asset.native();
    }
  })();

  // Check if recipient account exists
  const recipientAccount = await fetchAccount(transactionData.recipientAddress);

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
      {
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
        // For token transfers, recipient account must exist
        // We can't create an account with a token payment in Stellar
        if (!recipientAccount) {
          throw new UserInputError(
            "Recipient account does not exist. Token transfer on Stellar requires an existing account."
          );
        }

        transactionBuilder.addOperation(
          Operation.payment({
            destination: transactionData.recipientAddress,
            asset,
            amount,
          })
        );
      }
      break;

    // TODO
    //case TransactionMode.OPT_IN_TOKEN:

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

export {
  buildTransaction,
  calculateMaxSpendable,
  calculateMaxSpendableToken,
  calculateTransactionFee,
  convertToStroops,
  isValidAddress,
};
