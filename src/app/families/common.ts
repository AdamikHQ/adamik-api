import { ErrorMsg, TransactionData, TransactionMode, TransactionStatus } from "../model/types_WIP";

// TODO: Deprecate this whole function in favor of using directly Zod ?
async function prevalidateTransactionCommon(
  transaction: TransactionData,
  addressValidationFn: (address: string) => Promise<boolean>
): Promise<TransactionStatus> {
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];
  let validSender;
  // TODO: deprecate multiple senders?
  if ("senders" in transaction) {
    validSender = transaction.senders?.length && (await addressValidationFn(transaction.senders[0]));
    if (!validSender) {
      errors.push({ message: "Sender address is invalid" });
    }
  }

  if (
    transaction.mode === TransactionMode.DELEGATE ||
    transaction.mode === TransactionMode.TRANSFER ||
    transaction.mode === TransactionMode.TRANSFER_TOKEN
  ) {
    if (transaction.nonce && transaction.nonce < 0) {
      errors.push({ message: "Nonce cannot be negative" });
    }
    if (transaction.amount === undefined && !transaction.useMaxAmount) {
      errors.push({ message: "Missing amount or useMaxAmount" });
    } else if (!!transaction.amount && transaction.useMaxAmount) {
      errors.push({
        message: "Amount and useMaxAmount cannot be used together",
      });
    } else if (!!transaction.amount && transaction.amount < 0n) {
      errors.push({ message: "Amount cannot be negative" });
    } else if (!!transaction.amount && typeof transaction.amount !== "bigint") {
      errors.push({ message: "Amount must be an integer" });
    }
  }

  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.TRANSFER_TOKEN:
      {
        const validRecipient =
          transaction.recipients?.length && (await addressValidationFn(transaction.recipients[0]));
        if (!validRecipient) {
          errors.push({ message: "Recipient address is invalid" });
        }

        if (validSender && validRecipient && transaction.senders[0] === transaction.recipients[0]) {
          warnings.push({ message: "Same sender and recipient address" });
        }
      }
      break;
    case TransactionMode.DELEGATE: {
      const validValidator =
        transaction.validatorAddress?.length && (await addressValidationFn(transaction.validatorAddress));
      if (!validValidator) {
        errors.push({ message: "Validator address is invalid" });
      }
      break;
    }
    default: {
      // TODO Fine-tune this test by comparing with supported features of the chain (when implemented)
      // transaction mode need to be cast here because TS thing that transaction is never.
      errors.push({
        message: `Unsupported transaction mode ${transaction.mode} for chain ID ${transaction.chainId}`,
      });
      break;
    }
  }

  return {
    errors,
    warnings,
  };
}

export { prevalidateTransactionCommon };
