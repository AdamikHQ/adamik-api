import { CHAINS } from "~/app/config/chains";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { amountToSmallestUnit } from "~/app/tools/amount";
import { prevalidateTransactionCommon } from "../../common";
import { fetchAccount } from "../backend/horizon";
import {
  calculateMaxSpendable,
  calculateMaxSpendableToken,
  getAccountMinimumBalance,
  getStellarAsset,
  isValidAddress,
  MIN_BALANCE_STROOPS,
} from "../logic";
import { StellarService } from "../service";

async function prevalidateTransaction(
  this: StellarService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  await prevalidateTransactionCommon(this.chainId, {
    transactionData: transaction.data,
    addressValidationFn: async (address: string) => isValidAddress(address),
    status,
  });

  if (
    transaction.data.mode === TransactionMode.TRANSFER_TOKEN ||
    transaction.data.mode === TransactionMode.ENABLE_TOKEN
  ) {
    // Performs validation of the token ID
    getStellarAsset(transaction.data.tokenId);
  }
}

async function validateTransaction(
  this: StellarService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;
  const transactionData = transaction.data;

  // amount & fees are safe to cast as they're guaranteed to be set by completeTransaction
  const amount = transactionData.amount as bigint;
  const fees = transactionData.fees as bigint;

  // Fetch the sender account to validate balances
  const senderAccount = await fetchAccount(this.chainId, transactionData.senderAddress);
  if (!senderAccount) {
    status.errors.push({ message: "Balance is too low" });
    status.warnings.push({ message: "Sender address is inactive" });
    return; // No further validation possible if sender account is inactive
  }

  if (senderAccount.signers.length > 1) {
    status.warnings.push({ message: `Sender address ${transactionData.senderAddress} is multi-signed` });
  }

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER: {
      // Check if balance covers amount + fees
      const maxSpendable = calculateMaxSpendable(this.chainId, senderAccount, transactionData.mode);

      if (amount + fees > maxSpendable) {
        status.errors.push({ message: "Balance is too low" });
      }

      // Add warning if fees are high relative to amount
      if (amount > 0n && fees > (amount * 10n) / 100n) {
        status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }

      // Check if recipient account has been activated
      const recipientAccount = await fetchAccount(this.chainId, transactionData.recipientAddress);
      if (!recipientAccount && amount < MIN_BALANCE_STROOPS) {
        status.errors.push({
          message: `Recipient address is inactive, amount must be at least ${MIN_BALANCE_STROOPS} to activate it.`,
        });
      }

      break;
    }

    case TransactionMode.TRANSFER_TOKEN: {
      // Check if XLM balance covers fees
      const maxSpendable = calculateMaxSpendable(this.chainId, senderAccount, transactionData.mode);
      if (fees > maxSpendable) {
        status.errors.push({ message: "Balance is too low to cover the fees" });
      }

      // Check if token balance covers the transfer amount
      const maxTokenAmount = calculateMaxSpendableToken(this.chainId, senderAccount, transactionData.tokenId);
      if (maxTokenAmount === 0n || amount > maxTokenAmount) {
        status.errors.push({ message: "Token balance is too low" });
      }

      // Check if recipient account has been activated
      const recipientAccount = await fetchAccount(this.chainId, transactionData.recipientAddress);
      if (!recipientAccount) {
        status.errors.push({
          message: `Recipient address is inactive, it must be activated before receiving tokens.`,
        });
      } else {
        // Check if recipient account has enabled the token (has a trustline)
        const [assetCode, assetIssuer] = transactionData.tokenId.split(":");
        const hasTrustline = recipientAccount.balances.some(
          (balance) =>
            (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") &&
            balance.asset_code === assetCode &&
            balance.asset_issuer === assetIssuer
        );

        if (!hasTrustline) {
          status.errors.push({
            message: `Address ${transactionData.recipientAddress} has not enabled token ${assetCode}.`,
          });
        }
      }
      break;
    }

    case TransactionMode.ENABLE_TOKEN: {
      // Check if XLM balance covers fees
      const maxSpendable = calculateMaxSpendable(this.chainId, senderAccount, transactionData.mode);
      if (fees > maxSpendable) {
        status.errors.push({ message: "Balance is too low to cover the fees" });
      }

      // Check if sender has enough minimum balance to hold a new asset
      const minBalanceRequired = getAccountMinimumBalance(this.chainId, senderAccount, transactionData.mode);
      const xlmBalance = senderAccount.balances.find((balance) => balance.asset_type === "native");
      if (xlmBalance) {
        const currentBalance = BigInt(
          amountToSmallestUnit(xlmBalance.balance, CHAINS[this.chainId].decimals) ?? 0
        );

        if (currentBalance < minBalanceRequired) {
          status.errors.push({
            message: `Balance is too low to enable more tokens. Required minimum: ${minBalanceRequired}, current: ${currentBalance}.`,
          });
        }
      }

      // Check if recipient account has already enabled the token (has a trustline)
      const [assetCode, assetIssuer] = transactionData.tokenId.split(":");
      const hasTrustline = senderAccount.balances.some(
        (balance) =>
          (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") &&
          balance.asset_code === assetCode &&
          balance.asset_issuer === assetIssuer
      );

      if (hasTrustline) {
        status.warnings.push({
          message: `Address ${transactionData.senderAddress} has already enabled token ${assetCode}.`,
        });
      }

      break;
    }

    default:
      status.errors.push({
        message: `Transaction mode ${transactionData.mode} is not supported for chainId ${this.chainId}`,
      });
      break;
  }
}

export { prevalidateTransaction, validateTransaction };
