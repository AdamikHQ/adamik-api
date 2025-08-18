import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { fetchAccount } from "../backend/horizon";
import {
  calculateMaxSpendable,
  calculateMaxSpendableToken,
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

  // Check if recipient account has been activated
  const recipientAccount = await fetchAccount(transactionData.recipientAddress);
  if (!recipientAccount && amount < MIN_BALANCE_STROOPS) {
    status.errors.push({
      message: `Recipient address is inactive. Amount must be at least ${MIN_BALANCE_STROOPS} to activate it.`,
    });
  }

  // Fetch the sender account to validate balance
  const senderAccount = await fetchAccount(transactionData.senderAddress);
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
      const maxSpendable = calculateMaxSpendable(senderAccount);

      if (amount + fees > maxSpendable) {
        status.errors.push({ message: "Balance is too low" });
      }

      // Add warning if fees are high relative to amount
      if (amount > 0n && fees > (amount * 10n) / 100n) {
        status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }
      break;
    }

    case TransactionMode.TRANSFER_TOKEN: {
      // Check if XLM balance covers fees
      const maxSpendable = calculateMaxSpendable(senderAccount);
      if (fees > maxSpendable) {
        status.errors.push({ message: "Balance is too low to cover the fees" });
      }

      // Check if token balance covers the transfer amount
      const maxTokenAmount = calculateMaxSpendableToken(senderAccount, transactionData.tokenId);
      if (amount > maxTokenAmount) {
        status.errors.push({ message: "Token balance is too low" });
      }

      // Check if recipient account has enabled the token (has a trustline)
      if (recipientAccount) {
        const [assetCode, assetIssuer] = transactionData.tokenId.split(":");
        const hasTrustline = recipientAccount.balances.some(
          (balance) =>
            (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") &&
            balance.asset_code === assetCode &&
            balance.asset_issuer === assetIssuer
        );

        if (!hasTrustline) {
          status.errors.push({
            message: `Recipient address ${transactionData.recipientAddress} has not enabled the token ${assetCode}.`,
          });
        }
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
