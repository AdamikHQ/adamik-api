import { isAddress } from "viem";
import { PlainTransaction, TransactionStatus, ErrorMsg, TransactionMode } from "~/app/model/types_WIP";
import { EvmService } from ".";

async function validateTransactionIntent(
  this: EvmService,
  transaction: PlainTransaction
): Promise<TransactionStatus> {
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];

  const validSender = transaction.senders?.length && isAddress(transaction.senders[0]);
  if (!validSender) {
    errors.push({ message: "Sender address is invalid" });
  }

  const validRecipient = transaction.recipients?.length && isAddress(transaction.recipients[0]);
  if (!validRecipient) {
    errors.push({ message: "Recipient address is invalid" });
  }

  if (
    /*transaction.mode === "send" &&*/ validSender &&
    validRecipient &&
    transaction.senders[0] === transaction.recipients[0]
  ) {
    warnings.push({ message: "Same sender and recipient address" });
  }

  switch (transaction.mode) {
    case TransactionMode.TRANSFER: {
      if (transaction.amount === undefined && !transaction.useMaxAmount) {
        errors.push({ message: "Missing amount or useMaxAmount" });
      } else if (!!transaction.amount && transaction.useMaxAmount) {
        errors.push({
          message: "Amount and useMaxAmount cannot be used together",
        });
      } else if (transaction.amount && transaction.amount < 0n) {
        errors.push({ message: "Amount cannot be negative" });
      }
    }
  }

  return {
    errors,
    warnings,
  };
}

async function validateTransaction(
  this: EvmService,
  transaction: PlainTransaction
): Promise<TransactionStatus> {
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

  // TODO !!!

  return {
    errors,
    warnings,
  };
}

export { validateTransactionIntent, validateTransaction };
