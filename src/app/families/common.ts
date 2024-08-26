import { ErrorMsg, TransactionData, TransactionMode, TransactionStatus } from "../model/types_WIP";

// TODO: Deprecate this whole function in favor of using directly Zod ?
async function prevalidateTransactionCommon(
  transaction: TransactionData,
  addressValidationFn: (address: string) => Promise<boolean>
): Promise<TransactionStatus> {
  const errors: ErrorMsg[] = [];
  const warnings: ErrorMsg[] = [];

  // Logic validation
  const validSender = await addressValidationFn(transaction.sender);
  if (!validSender) {
    errors.push({ message: "Sender address is invalid" });
  }

  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.TRANSFER_TOKEN:
      const validRecipient = await addressValidationFn(transaction.recipient);
      if (!validRecipient) {
        errors.push({ message: "Recipient address is invalid" });
      }

      if (validSender && validRecipient && transaction.sender === transaction.recipient) {
        warnings.push({ message: "Same sender and recipient address" });
      }
      break;
    case TransactionMode.DELEGATE:
    case TransactionMode.UNDELEGATE:
    case TransactionMode.CLAIM_REWARDS:
      const validValidator =
        transaction.validatorAddress?.length && (await addressValidationFn(transaction.validatorAddress));
      if (!validValidator) {
        errors.push({ message: "Validator address is invalid" });
      }
      break;
    case TransactionMode.REDELEGATE:
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
      break;
    default: // ensure exhaustive check, both at compile time and runtime: https://basarat.gitbook.io/typescript/type-system/discriminated-unions#exhaustive-checks
      const assertNever = (x: never): never => {
        throw new Error(`Encountered unexpected/unknown transaction mode: ${(transaction as any).mode}`);
      };
      assertNever(transaction);
  }
  return {
    errors,
    warnings,
  };
}

export { prevalidateTransactionCommon };
