import { CHAINS } from "../config/chains";
import {
  ChainFeature,
  ErrorMsg,
  PlainTransaction,
  TransactionMode,
  TransactionStatus,
} from "../model/types_WIP";

async function prevalidateTransactionCommon(
  transaction: PlainTransaction,
  addressValidationFn: (address: string) => Promise<boolean>
): Promise<TransactionStatus> {
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];

  // Validation of feature support

  const chain = CHAINS[transaction.chainId];
  try {
    switch (transaction.mode) {
      case TransactionMode.TRANSFER:
        if (!chain.supportedFeatures.includes(ChainFeature.TRANSACTIONS_NATIVE)) {
          throw new Error();
        }
        break;
      case TransactionMode.TRANSFER_TOKEN:
        if (!chain.supportedFeatures.includes(ChainFeature.TRANSACTIONS_TOKENS)) {
          throw new Error();
        }
        break;
      case TransactionMode.DELEGATE:
      case TransactionMode.UNDELEGATE:
      case TransactionMode.CLAIM_REWARDS:
      case TransactionMode.REDELEGATE:
        if (!chain.supportedFeatures.includes(ChainFeature.TRANSACTIONS_STAKING)) {
          throw new Error();
        }
        break;
      default: {
        throw new Error();
      }
    }
  } catch (e) {
    errors.push({
      message: `Unsupported transaction mode ${transaction.mode} for chain ID ${transaction.chainId}`,
    });
  }

  // Logic validation

  const validSender = transaction.senders?.length && (await addressValidationFn(transaction.senders[0]));
  if (!validSender) {
    errors.push({ message: "Sender address is invalid" });
  }

  if (transaction.nonce && transaction.nonce < 0) {
    errors.push({ message: "Nonce cannot be negative" });
  }

  if (transaction.mode !== TransactionMode.CLAIM_REWARDS) {
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
    case TransactionMode.REDELEGATE:
      {
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
      break;
  }

  return {
    errors,
    warnings,
  };
}

export { prevalidateTransactionCommon };
