import { TransactionData, TransactionMode } from "../model/types_WIP";
import type { AdamikStatus } from "../tools/handlers/apiHandler";

// Validations that couldn't have been done with Zod
async function prevalidateTransactionCommon(
  transaction: TransactionData,
  addressValidationFn: (address: string) => Promise<boolean>
): Promise<AdamikStatus> {
  let status: AdamikStatus = { errors: [], warnings: [] };
  // Logic validation
  const validSender = await addressValidationFn(transaction.sender);
  if (!validSender) {
    status.errors.push({ message: "Sender address is invalid" });
  }

  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.TRANSFER_TOKEN:
      const validRecipient = await addressValidationFn(transaction.recipient);
      if (!validRecipient) {
        status.errors.push({ message: "Recipient address is invalid" });
      }

      if (validSender && validRecipient && transaction.sender === transaction.recipient) {
        status.warnings.push({ message: "Same sender and recipient address" });
      }
      break;
    case TransactionMode.DELEGATE:
    case TransactionMode.UNDELEGATE:
    case TransactionMode.CLAIM_REWARDS:
      const validValidator =
        transaction.validatorAddress?.length && (await addressValidationFn(transaction.validatorAddress));
      if (!validValidator) {
        status.errors.push({ message: "Validator address is invalid" });
      }
      break;
    case TransactionMode.REDELEGATE:
      const validSourceValidator =
        transaction.sourceValidatorAddress?.length &&
        (await addressValidationFn(transaction.sourceValidatorAddress));
      if (!validSourceValidator) {
        status.errors.push({ message: "Source validator address is invalid" });
      }

      const validTargetValidator =
        transaction.targetValidatorAddress?.length &&
        (await addressValidationFn(transaction.targetValidatorAddress));
      if (!validTargetValidator) {
        status.errors.push({ message: "Target validator address is invalid" });
      }
      break;
    default: // ensure exhaustive check, both at compile time and runtime: https://basarat.gitbook.io/typescript/type-system/discriminated-unions#exhaustive-checks
      const assertNever = (x: never): never => {
        throw new Error(`Encountered unexpected/unknown transaction mode: ${(transaction as any).mode}`);
      };
      assertNever(transaction);
  }
  return status;
}

export { prevalidateTransactionCommon };
