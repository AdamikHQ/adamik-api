import { Status, TransactionData, TransactionMode } from "../model/types_WIP";
import { InvalidPaginationTokenError } from "../tools/handlers/errors";

// Convert any pagination data ("next" cursor, from/to timestamp, offset/limit parameters, etc...)
// to a base64 string, that can be conveniently included in API responses
function paginationToB64(data: unknown): string | null {
  if (!data) {
    return null;
  }

  try {
    return Buffer.from(JSON.stringify(data)).toString("base64");
  } catch (e) {
    return null;
  }
}

// Convert back a base64 pagination token provided in an API request, to the original pagination data
// ("next" cursor, from/to timestamp, offset/limit parameters, etc...)
function paginationFromB64(tokenB64?: string): any | null {
  if (!tokenB64) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(tokenB64, "base64").toString("utf8"));
  } catch (e) {
    throw new InvalidPaginationTokenError("Provided pagination token is invalid");
  }
}

// Validations that couldn't have been done with Zod
async function prevalidateTransactionCommon(_: {
  transactionData: TransactionData;
  status: Status;
  addressValidationFn: (address: string) => Promise<boolean>;
}): Promise<Status> {
  const { transactionData, addressValidationFn, status } = _;

  // Logic validation
  const validSender = await addressValidationFn(transactionData.sender);
  if (!validSender) {
    status.errors.push({ message: "Sender address is invalid" });
  }

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
    case TransactionMode.TRANSFER_TOKEN:
      const validRecipient = await addressValidationFn(transactionData.recipient);
      if (!validRecipient) {
        status.errors.push({ message: "Recipient address is invalid" });
      }

      if (validSender && validRecipient && transactionData.sender === transactionData.recipient) {
        status.warnings.push({ message: "Same sender and recipient address" });
      }
      break;
    case TransactionMode.DELEGATE:
    case TransactionMode.UNDELEGATE:
    case TransactionMode.CLAIM_REWARDS:
      const validValidator =
        transactionData.validatorAddress?.length &&
        (await addressValidationFn(transactionData.validatorAddress));
      if (!validValidator) {
        status.errors.push({ message: "Validator address is invalid" });
      }
      break;
    case TransactionMode.REDELEGATE:
      const validSourceValidator =
        transactionData.sourceValidatorAddress?.length &&
        (await addressValidationFn(transactionData.sourceValidatorAddress));
      if (!validSourceValidator) {
        status.errors.push({ message: "Source validator address is invalid" });
      }

      const validTargetValidator =
        transactionData.targetValidatorAddress?.length &&
        (await addressValidationFn(transactionData.targetValidatorAddress));
      if (!validTargetValidator) {
        status.errors.push({ message: "Target validator address is invalid" });
      }
      break;
    default: // ensure exhaustive check, both at compile time and runtime: https://basarat.gitbook.io/typescript/type-system/discriminated-unions#exhaustive-checks
      const assertNever = (x: never): never => {
        throw new Error(`Encountered unexpected/unknown transaction mode: ${(transactionData as any).mode}`);
      };
      assertNever(transactionData);
  }
  return status;
}

export { paginationFromB64, paginationToB64, prevalidateTransactionCommon };
