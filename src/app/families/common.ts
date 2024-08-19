import { CHAINS } from "../config/chains";
import { ChainFeature, ErrorMsg, Transaction, TransactionMode, TransactionStatus } from "../model/types_WIP";

// TODO: Deprecate this whole function in favor of using directly Zod ?
async function prevalidateTransactionCommon(
  transaction: Transaction["data"],
  addressValidationFn: (address: string) => Promise<boolean>
): Promise<TransactionStatus> {
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];

  // Logic validation
  const validSender = await addressValidationFn(transaction.sender);
  if (!validSender) {
    errors.push({ message: "Sender address is invalid" });
  }

  if (transaction.nonce && transaction.nonce < 0) {
    errors.push({ message: "Nonce cannot be negative" });
  }

  // TODO: remove this? it's already checked by zod
  if (transaction.mode !== TransactionMode.CLAIM_REWARDS) {
    if (transaction.recipients[0].amount === undefined && !transaction.useMaxAmount) {
      errors.push({ message: "Missing amount or useMaxAmount" });
    } else if (!!transaction.recipients[0].amount && transaction.useMaxAmount) {
      errors.push({
        message: "Amount and useMaxAmount cannot be used together",
      });
    } else if (!!transaction.recipients[0].amount && transaction.recipients[0].amount < 0n) {
      errors.push({ message: "Amount cannot be negative" });
    } else if (!!transaction.recipients[0].amount && typeof transaction.recipients[0].amount !== "bigint") {
      errors.push({ message: "Amount must be an integer" });
    }
  }

  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.TRANSFER_TOKEN:
      {
        const validRecipient =
          transaction.recipients?.length && (await addressValidationFn(transaction.recipients[0].address));
        if (!validRecipient) {
          errors.push({ message: "Recipient address is invalid" });
        }

        if (validSender && validRecipient && transaction.sender === transaction.recipients[0].address) {
          warnings.push({ message: "Same sender and recipient address" });
        }
      }
      break;
    case TransactionMode.DELEGATE:
    case TransactionMode.UNDELEGATE:
    case TransactionMode.CLAIM_REWARDS:
      {
        const validValidator =
          transaction.validatorAddress?.length && (await addressValidationFn(transaction.validatorAddress));
        if (!validValidator) {
          errors.push({ message: "Validator address is invalid" });
        }
      }
      break;

    case TransactionMode.REDELEGATE: {
      const validSourceValidator =
        transaction.sourceValidatorAddress?.length &&
        (await addressValidationFn(transaction.sourceValidatorAddress));
      if (!validSourceValidator) {
        errors.push({ message: "Source validator address is invalid" });
      }

      const validTargetValidator =
        transaction.targetValidatorAddress?.length &&
        (await addressValidationFn(transaction.targetValidatorAddress));
      if (!validTargetValidator) {
        errors.push({ message: "Target validator address is invalid" });
      }
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
