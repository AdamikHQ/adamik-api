import { isValidAddress } from "algosdk";
import { PlainTransaction, TransactionStatus, ErrorMsg } from "~/app/model/types_WIP";
import { ALGORAND_MAX_MEMO_SIZE, isAmountValidForRecipient, estimateMaxSpendable } from "../logic";

async function validateTransactionIntent(transaction: PlainTransaction): Promise<TransactionStatus> {
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];

  const validSender = isValidAddress(transaction.senders[0]);
  if (!validSender) {
    errors.push({ message: "Sender address is invalid" });
  }

  const validRecipient = isValidAddress(transaction.recipients[0]);
  if (!validRecipient) {
    errors.push({ message: "Recipient address is invalid" });
  }

  if (
    /*transaction.mode === "send" &&*/ validSender &&
    transaction.senders[0] === transaction.recipients[0]
  ) {
    warnings.push({ message: "Same sender and recipient address" });
  }

  switch (transaction.mode) {
    case "transfer": {
      if (transaction.amount === undefined && !transaction.useMaxAmount) {
        errors.push({ message: "Missing amount or useMaxAmount" });
      } else if (transaction.amount !== undefined && transaction.useMaxAmount) {
        errors.push({
          message: "Amount and useMaxAmount cannot be used together",
        });
      } else if (transaction.amount && transaction.amount < 0) {
        errors.push({ message: "Amount cannot be negative" });
      }
    }
  }

  return {
    errors,
    warnings,
  };
}

// FIXME Should useMaxAmount be considered in this function?... or just the amount, whatever it is?
async function validateTransaction(transaction: PlainTransaction): Promise<TransactionStatus> {
  // TODO Settle this (should validateTransaction call validateTransactionIntent first?)
  //*
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];
  /*/
  const { errors, warnings } = await validateTransactionIntent(transaction);
  if (errors.length) {
    return {
      errors,
      warnings,
    };
  }
  //*/

  // FIXME Shouldn't recompute this in this function
  const maxSpendable = await estimateMaxSpendable(transaction);

  switch (transaction.mode) {
    case "transfer": {
      if (!(await isAmountValidForRecipient(transaction.recipients[0], transaction.amount))) {
        errors.push({
          message: "Recipient address is inactive. Send at least 0.1 ALGO to activate it",
        });
      }

      if (transaction.amount + transaction.fees > maxSpendable) {
        errors.push({ message: "Balance is too low" });
      } else if (transaction.amount < transaction.fees * 10n) {
        warnings.push({ message: "Network fees are above 10% of the amount" });
      }

      break;
    }

    /*
    case "optIn": {
      if (!transaction.fees || !transaction.fees.gt(0)) {
        errors.fees = new FeeNotLoaded();
      }

      // This error doesn't need to be translate,
      // it will use to block until the user choose an assetId
      if (!transaction.assetId) {
        errors.assetId = new Error("Asset Id is not set");
      }

      if (algoSpendableBalance.lt(estimatedFees)) {
        errors.amount = new NotEnoughBalance();
      }

      break;
    }

    case "claimReward": {
      if (algoSpendableBalance.lt(totalSpent)) {
        errors.amount = new NotEnoughBalance();
      }

      if (estimatedFees.gt(algorandResources.rewards)) {
        warnings.claimReward = new ClaimRewardsFeesWarning();
      }

      break;
    }
    */
  }

  if (transaction.memo && transaction.memo.length > ALGORAND_MAX_MEMO_SIZE) {
    throw new Error("Memo is too long");
  }

  return {
    errors,
    warnings,
  };
}

export { validateTransactionIntent, validateTransaction };
