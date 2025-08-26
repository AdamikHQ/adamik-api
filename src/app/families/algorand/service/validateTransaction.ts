import { isValidAddress } from "algosdk";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { fetchAccount } from "../backend/node";
import {
  ALGORAND_MAX_MEMO_SIZE,
  addressHasAsset,
  computeMaxSpendable,
  computeMinimumAlgoBalance,
  isAmountValidForRecipient,
} from "../logic";
import { AlgorandService } from "../service";

async function prevalidateTransaction(
  this: AlgorandService,
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
  this: AlgorandService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;
  const transactionData = transaction.data;

  if (transactionData.memo && transactionData.memo.length > ALGORAND_MAX_MEMO_SIZE) {
    status.errors.push({ message: "Memo is too long" });
  }

  // amount & fees are safe to cast as they're guaranteed to be filled in by completeTransaction
  const amount = transactionData.amount as bigint;
  const fees = transactionData.fees as bigint;

  // FIXME Already called by completeTransaction,
  // should ideally be put in some common context, or at least some cache
  const maxSpendable = await computeMaxSpendable(transactionData);

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER: {
      if (amount + fees > maxSpendable.native) {
        status.errors.push({ message: "Balance is too low" });
      } else if (amount < fees * 10n) {
        status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }

      if (!(await isAmountValidForRecipient(transactionData.recipientAddress, amount))) {
        status.errors.push({
          message: "Recipient address is inactive. Send at least 0.1 ALGO to activate it",
        });
      }

      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (fees > maxSpendable.native) {
        status.errors.push({
          message: "Balance is too low to cover the fees",
        });
      }

      if (maxSpendable.token === undefined || amount > maxSpendable.token) {
        status.errors.push({ message: "Token balance is too low" });
      }

      if (!(await isAmountValidForRecipient(transactionData.recipientAddress, amount))) {
        status.errors.push({
          message: "Recipient address is inactive. Send at least 0.1 ALGO to activate it",
        });
      }

      if (!(await addressHasAsset(transactionData.recipientAddress, transactionData.tokenId))) {
        status.errors.push({
          message: `Address ${transactionData.recipientAddress} has not enabled token ${transactionData.tokenId}.`,
        });
      }

      break;
    }

    case TransactionMode.ENABLE_TOKEN: {
      if (fees > maxSpendable.native) {
        status.errors.push({
          message: "Balance is too low to cover the fees",
        });
      }

      // Check if sender has enough minimum balance to hold a new asset
      const { balance, assetAmounts } = await fetchAccount(transactionData.senderAddress);
      const minBalanceRequired = computeMinimumAlgoBalance(transactionData.mode, assetAmounts.length);
      const currentBalance = BigInt(balance);

      if (currentBalance < BigInt(minBalanceRequired)) {
        status.errors.push({
          message: `Balance is too low to enable more tokens. Required minimum: ${minBalanceRequired}, current: ${currentBalance}.`,
        });
      }

      // Check if the user is already opted in to this asset
      if (await addressHasAsset(transactionData.senderAddress, transactionData.tokenId)) {
        status.warnings.push({
          message: `Address ${transactionData.senderAddress} has already enabled token ${transactionData.tokenId}.`,
        });
      }

      break;
    }
  }
}

export { prevalidateTransaction, validateTransaction };
