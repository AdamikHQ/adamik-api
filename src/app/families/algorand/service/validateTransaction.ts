import { isValidAddress } from "algosdk";
import { CompleteTransaction, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { AlgorandService } from ".";
import {
  ALGORAND_MAX_MEMO_SIZE,
  addressHasAsset,
  computeMaxSpendable,
  isAmountValidForRecipient,
} from "../logic";

async function prevalidateTransaction(this: AlgorandService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.data, async (address: string) =>
    isValidAddress(address)
  );

  if (transaction.data.format) {
    transaction.status.warnings.push({
      message: `Field 'format' is not supported for chain ID ${this.chainId}`,
    });
  }
}

async function validateTransaction(this: AlgorandService, transaction: CompleteTransaction): Promise<void> {
  if (transaction.data.memo && transaction.data.memo.length > ALGORAND_MAX_MEMO_SIZE) {
    transaction.status.errors.push({ message: "Memo is too long" });
  }

  // FIXME Already called by completeTransaction,
  // should ideally be put in some common context, or at least some cache
  const maxSpendable = await computeMaxSpendable(transaction.data);

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER: {
      if (transaction.data.recipients[0].amount + transaction.data.fees > maxSpendable.native) {
        transaction.status.errors.push({ message: "Balance is too low" });
      } else if (transaction.data.recipients[0].amount < transaction.data.fees * 10n) {
        transaction.status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }

      if (!(await isAmountValidForRecipient(transaction.data.recipients[0]))) {
        transaction.status.errors.push({
          message: "Recipient address is inactive. Send at least 0.1 ALGO to activate it",
        });
      }

      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (transaction.data.fees > maxSpendable.native) {
        transaction.status.errors.push({
          message: "Balance is too low to cover the fees",
        });
      }

      if (maxSpendable.token === undefined || transaction.data.recipients[0].amount > maxSpendable.token) {
        transaction.status.errors.push({ message: "Token balance is too low" });
      }

      if (!(await isAmountValidForRecipient(transaction.data.recipients[0]))) {
        transaction.status.errors.push({
          message: "Recipient address is inactive. Send at least 0.1 ALGO to activate it",
        });
      }

      if (!(await addressHasAsset(transaction.data.recipients[0].address, transaction.data.tokenId))) {
        transaction.status.errors.push({
          message: "Recipient address has not opted in for the selected ASA",
        });
      }

      break;
    }

    /*
    case "optIn": {
      if (!transaction.plain.fees || !transaction.plain.fees.gt(0)) {
        errors.fees = new FeeNotLoaded();
      }

      // This error doesn't need to be translate,
      // it will use to block until the user choose an assetId
      if (!transaction.plain.assetId) {
        errors.assetId = new Error("Asset Id is not set");
      }

      if (algoSpendableBalance.lt(computeFees)) {
        errors.amount = new NotEnoughBalance();
      }

      break;
    }
    */
  }
}

export { prevalidateTransaction, validateTransaction };
