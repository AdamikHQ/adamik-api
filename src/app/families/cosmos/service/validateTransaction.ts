import { PlainTransaction, TransactionStatus, ErrorMsg, ChainId } from "~/app/model/types_WIP";
import { isValidAddress } from "../logic";

// FIXME Same implem as algorand... something to make generic?
async function validateTransactionIntent(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<TransactionStatus> {
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];

  const validSender = transaction.senders?.length && isValidAddress(chainId, transaction.senders[0]);
  if (!validSender) {
    errors.push({ message: "Sender address is invalid" });
  }

  if (transaction.mode === "transfer") {
    const validRecipient =
      transaction.recipients?.length && isValidAddress(chainId, transaction.recipients[0]);
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
  } else if (transaction.mode === "delegate") {
    const validValidator = transaction.validator.length && isValidAddress(chainId, transaction.validator);
    if (!validValidator) {
      errors.push({ message: "Validator address is invalid" });
    }
  }

  switch (transaction.mode) {
    case "transfer": {
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
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<TransactionStatus> {
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
  // NOTE amount can't be 0 on cosmos?...

  return {
    errors,
    warnings,
  };
}

export { validateTransactionIntent, validateTransaction };
