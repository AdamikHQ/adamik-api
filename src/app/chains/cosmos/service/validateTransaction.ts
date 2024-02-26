import { PlainTransaction, TransactionStatus, ErrorMsg } from "~/app/model/types_WIP";
import { isValidAddress } from "../logic";

// FIXME Same implem as algorand... something to make generic?
async function validateTransactionIntent(transaction: PlainTransaction): Promise<TransactionStatus> {
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];

  const validSender = transaction.senders?.length && isValidAddress(transaction.senders[0]);
  if (!validSender) {
    errors.push({ message: "Sender address is invalid" });
  }

  const validRecipient = transaction.recipients?.length && isValidAddress(transaction.recipients[0]);
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
    case "transfer": {
      if (!transaction.amount && !transaction.useMaxAmount) {
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

  // TODO

  return {
    errors,
    warnings,
  };
}

export { validateTransactionIntent, validateTransaction };
