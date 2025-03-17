import { ChainId, Status, TransactionData, TransactionMode } from "../model/types_WIP";
import { UnsupportedFeatureError } from "../tools/handlers/errors";

// Validations that couldn't have been done with Zod
async function prevalidateTransactionCommon(
  chainId: ChainId,
  _: {
    transactionData: TransactionData;
    addressValidationFn: (address: string) => Promise<boolean>;
    status: Status;
  }
): Promise<Status> {
  const { transactionData, addressValidationFn, status } = _;
  const { mode } = transactionData;

  switch (mode) {
    case TransactionMode.DEPLOY_ACCOUNT:
      {
        // TODO Validate senderPubKey ?
        // TODO Validate contractType ?
      }
      break;
    case TransactionMode.TRANSFER:
    // TODO Validate tokenId ?
    case TransactionMode.TRANSFER_TOKEN:
      {
        const validSender = await addressValidationFn(transactionData.senderAddress);
        if (!validSender) {
          status.errors.push({ message: "Sender address is invalid" });
        }

        const validRecipient = await addressValidationFn(transactionData.recipientAddress);
        if (!validRecipient) {
          status.errors.push({ message: "Recipient address is invalid" });
        }

        if (
          validSender &&
          validRecipient &&
          transactionData.senderAddress === transactionData.recipientAddress
        ) {
          status.warnings.push({ message: "Same sender and recipient address" });
        }

        validateAmountOrUseMaxAmount(transactionData, status);
      }
      break;
    case TransactionMode.STAKE:
      {
        const validSender = await addressValidationFn(transactionData.senderAddress);
        if (!validSender) {
          status.errors.push({ message: "Sender address is invalid" });
        }

        const validSourceValidator =
          transactionData.sourceValidatorAddress?.length &&
          (await addressValidationFn(transactionData.sourceValidatorAddress));
        if ("sourceValidatorAddress" in transactionData && !validSourceValidator) {
          status.errors.push({ message: "Source validator address is invalid" });
        }

        const validTargetValidator =
          transactionData.targetValidatorAddress.length &&
          (await addressValidationFn(transactionData.targetValidatorAddress));
        if (!validTargetValidator) {
          status.errors.push({ message: "Target validator address is invalid" });
        }

        validateAmountOrUseMaxAmount(transactionData, status);
      }
      break;
    case TransactionMode.UNSTAKE:
      {
        const validSender = await addressValidationFn(transactionData.senderAddress);
        if (!validSender) {
          status.errors.push({ message: "Sender address is invalid" });
        }

        const validValidator =
          transactionData.validatorAddress?.length &&
          (await addressValidationFn(transactionData.validatorAddress));
        if (!validValidator) {
          status.errors.push({ message: "Validator address is invalid" });
        }

        validateAmountOrUseMaxAmount(transactionData, status);
      }
      break;
    case TransactionMode.CLAIM_REWARDS:
      {
        const validSender = await addressValidationFn(transactionData.senderAddress);
        if (!validSender) {
          status.errors.push({ message: "Sender address is invalid" });
        }

        const validValidator =
          transactionData.validatorAddress?.length &&
          (await addressValidationFn(transactionData.validatorAddress));
        if (!validValidator) {
          status.errors.push({ message: "Validator address is invalid" });
        }
      }
      break;
    case TransactionMode.WITHDRAW:
      {
        // TODO
      }
      break;
    case TransactionMode.REGISTER_STAKE:
      {
        // TODO
      }
      break;
    default:
      // Ensure exhaustive check, both at compile time and runtime
      // https://basarat.gitbook.io/typescript/type-system/discriminated-unions#exhaustive-checks
      const assertNever = (x: never): never => {
        throw new UnsupportedFeatureError(`Transaction mode ${mode} is not supported for chainId ${chainId}`);
      };
      assertNever(transactionData);
  }
  return status;
}

// TODO Once Zod 4 is out, we can replace this with a superRefine on the relevant schemas
// (cf: https://github.com/colinhacks/zod/issues/2474#issuecomment-2101077363)
function validateAmountOrUseMaxAmount(
  transactionData: { amount?: bigint; useMaxAmount?: boolean },
  status: Status
) {
  if (transactionData.useMaxAmount && "amount" in transactionData) {
    status.errors.push({ message: "amount and useMaxAmount cannot be used together" });
  } else if (!transactionData.useMaxAmount && !("amount" in transactionData)) {
    status.errors.push({ message: "Missing amount or useMaxAmount" });
  }
}

export { prevalidateTransactionCommon };
