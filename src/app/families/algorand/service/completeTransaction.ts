import {
  PlainTransaction,
  Transaction,
  TransactionMode,
  TransactionSpendableAmounts,
  TransactionStatus,
} from "~/app/model/types_WIP";
import {
  ALGORAND_MAX_MEMO_SIZE,
  isAmountValidForRecipient,
  computeMaxSpendable,
  computeFees,
  addressHasAsset,
} from "../logic";
import { AlgorandService } from ".";

async function completeTransaction(
  this: AlgorandService,
  transaction: PlainTransaction
): Promise<Transaction> {
  const status: TransactionStatus = { errors: [], warnings: [] };

  // Completion
  const fees = await computeFees(transaction);

  const maxSpendable = await computeMaxSpendable(transaction);

  const amount = await (async () => {
    if (transaction.useMaxAmount) {
      // - For a token transaction, the max spent amount is just the token balance, because fees are deducted from the native balance
      // - For a native transaction, the max spent amount is the native amount minus the fees, because both tap in the same native balance
      const amount =
        transaction.mode === TransactionMode.TRANSFER_TOKEN ? maxSpendable.token : maxSpendable.native - fees;
      return amount && amount >= 0n ? amount : 0n;
    } else {
      return transaction.amount;
    }
  })();

  transaction.amount = amount;
  transaction.fees = fees;

  // Validation
  await validateTransaction(transaction, maxSpendable, status);

  return { plain: transaction, status };
}

// Update input 'status' (which is mutated)
async function validateTransaction(
  transaction: PlainTransaction,
  maxSpendable: TransactionSpendableAmounts,
  status: TransactionStatus
): Promise<void> {
  if (transaction.memo && transaction.memo.length > ALGORAND_MAX_MEMO_SIZE) {
    status.errors.push({ message: "Memo is too long" });
  }

  switch (transaction.mode) {
    case TransactionMode.TRANSFER: {
      if (transaction.amount + transaction.fees > maxSpendable.native) {
        status.errors.push({ message: "Balance is too low" });
      } else if (transaction.amount < transaction.fees * 10n) {
        status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }

      if (!(await isAmountValidForRecipient(transaction.recipients[0], transaction.amount))) {
        status.errors.push({
          message: "Recipient address is inactive. Send at least 0.1 ALGO to activate it",
        });
      }

      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (transaction.fees > maxSpendable.native) {
        status.errors.push({ message: "Balance is too low" });
      }

      if (maxSpendable.token !== undefined && transaction.amount > maxSpendable.token) {
        status.errors.push({ message: "Token balance is too low" });
      }

      if (!(await isAmountValidForRecipient(transaction.recipients[0], 0n))) {
        status.errors.push({
          message: "Recipient address is inactive. Send at least 0.1 ALGO to activate it",
        });
      }

      if (!(await addressHasAsset(transaction.recipients[0], transaction.tokenId))) {
        status.errors.push({
          message: "Recipient address has not opted in for the selected ASA",
        });
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

      if (algoSpendableBalance.lt(computeFees)) {
        errors.amount = new NotEnoughBalance();
      }

      break;
    }
    */
  }
}

export { completeTransaction };
