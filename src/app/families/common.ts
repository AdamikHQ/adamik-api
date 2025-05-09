import { CHAINS } from "../config/chains";
import {
  AccountState,
  ChainId,
  FinalizedTransaction,
  Provider,
  ProviderType,
  Status,
  TransactionData,
  TransactionMode,
} from "../model/types_WIP";
import { ThirdPartyProviderError, UnsupportedFeatureError } from "../tools/handlers/errors";

export const getProviderUrls = (chainId: ChainId, providerType: ProviderType): string[] => {
  const provider = CHAINS[chainId].providers.find((p: Provider) => p.type === providerType);
  if (!provider) {
    throw new ThirdPartyProviderError(`No type ${providerType} found for ${chainId}`);
  }

  if (Array.isArray(provider.urls)) {
    return provider.urls;
  } else {
    throw new ThirdPartyProviderError(`Invalid type ${providerType} provider URL for ${chainId}`);
  }
};

// Handles multiple providers
async function getAccountStatefromProviders(
  chainId: ChainId,
  accountId: string,
  fetchAccountDataFunctions: ((chainId: ChainId, accountId: string) => Promise<AccountState>)[]
): Promise<AccountState> {
  const errors: Error[] = [];

  // Failover: try all providers until one works
  for (const fetchAccountDataFunction of fetchAccountDataFunctions) {
    try {
      return await fetchAccountDataFunction(chainId, accountId);
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next provider if available
    }
  }

  // Reaching here means even failover didn't work
  console.warn(`/!\\ Failed to fetch state of account ${accountId}:`, JSON.stringify(errors, null, 2));
  throw new ThirdPartyProviderError("Failed to fetch account state");
}

async function getTransactionfromProviders(
  chainId: ChainId,
  transactionId: string,
  fetchTransactionFunctions: ((
    chainId: ChainId,
    transactionId: string
  ) => Promise<FinalizedTransaction | null>)[]
): Promise<FinalizedTransaction | null> {
  const errors: Error[] = [];

  // Failover: try all providers until one works
  for (const fetchTransactionFunction of fetchTransactionFunctions) {
    try {
      return await fetchTransactionFunction(chainId, transactionId);
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next provider if available
    }
  }

  // Reaching here means even failover didn't work
  console.warn(`/!\\ Failed to fetch transation with ID ${transactionId}:`, JSON.stringify(errors, null, 2));
  throw new ThirdPartyProviderError("Failed to fetch transaction");
}

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

  validateTransactionMode(chainId, mode);

  switch (mode) {
    case TransactionMode.DEPLOY_ACCOUNT:
      {
        // TODO Validate senderPubKey ?
        // TODO Validate contractType ?
      }
      break;
    case TransactionMode.TRANSFER:
    case TransactionMode.TRANSFER_TOKEN:
      {
        // TODO Validate tokenId ?

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

function validateTransactionMode(chainId: ChainId, mode: TransactionMode) {
  const supported = CHAINS[chainId].supportedFeatures.write.transaction.type[mode];
  if (!supported) {
    throw new UnsupportedFeatureError(`Transaction mode ${mode} is not supported for chainId ${chainId}`);
  }
}

export { getAccountStatefromProviders, getTransactionfromProviders, prevalidateTransactionCommon };
