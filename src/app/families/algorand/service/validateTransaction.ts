import { isValidAddress } from "algosdk";
import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import type { AdamikStatus } from "~/app/tools/handlers/apiHandler";
import { AlgorandService } from ".";
import { prevalidateTransactionCommon } from "../../common";
import {
  ALGORAND_MAX_MEMO_SIZE,
  addressHasAsset,
  computeMaxSpendable,
  isAmountValidForRecipient,
} from "../logic";

async function prevalidateTransaction(
  this: AlgorandService,
  transaction: Transaction,
  status: AdamikStatus
): Promise<void> {
  status = await prevalidateTransactionCommon(transaction.data, async (address: string) =>
    isValidAddress(address)
  );

  if (transaction.data.format) {
    status.warnings.push({
      message: `Field 'format' is not supported for chainId ${this.chainId}, it will be ignored`,
    });
  }
}

async function validateTransaction(
  this: AlgorandService,
  transaction: Transaction,
  status: AdamikStatus
): Promise<void> {
  if (transaction.data.memo && transaction.data.memo.length > ALGORAND_MAX_MEMO_SIZE) {
    status.errors.push({ message: "Memo is too long" });
  }

  // amount & fees are safe to cast as they're guaranteed to be filled in by completeTransaction
  const amount = transaction.data.amount as bigint;
  const fees = transaction.data.fees as bigint;

  // FIXME Already called by transaction,
  // should ideally be put in some common context, or at least some cache
  const maxSpendable = await computeMaxSpendable(transaction.data);

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER: {
      if (amount + fees > maxSpendable.native) {
        status.errors.push({ message: "Balance is too low" });
      } else if (amount < fees * 10n) {
        status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }

      if (!(await isAmountValidForRecipient(transaction.data.recipient, amount))) {
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

      if (!(await isAmountValidForRecipient(transaction.data.recipient, amount))) {
        status.errors.push({
          message: "Recipient address is inactive. Send at least 0.1 ALGO to activate it",
        });
      }

      if (!(await addressHasAsset(transaction.data.recipient, transaction.data.tokenId))) {
        status.errors.push({
          message: "Recipient address has not opted in for the selected ASA",
        });
      }

      break;
    }

    /*
    case "optIn": {
      if (!transaction.data.fees || !transaction.data.fees.gt(0)) {
        errors.fees = new FeeNotLoaded();
      }

      // This error doesn't need to be translate,
      // it will use to block until the user choose an assetId
      if (!transaction.data.assetId) {
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
