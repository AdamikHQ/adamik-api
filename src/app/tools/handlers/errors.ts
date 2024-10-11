import type { ChainId, Status } from "~/app/model/types_WIP";

export abstract class AdamikHttpError extends Error {
  abstract statusText: string;
  abstract status: number;

  constructor(message?: string) {
    super(message);
  }
}

/**
 * This error should be the one used most of the time. Consider creating a custom error when reusing the same error message or statusText
 */
export class UserInputError extends AdamikHttpError {
  name = "UserInputError";
  statusText;
  status = 400;

  // FIXME Most uses of this class only provide the 'message' param, but passed as 'statusText'
  constructor(statusText: string, message?: string) {
    super(message);
    this.statusText = statusText;
  }
}

export class UnsupportedFeatureError extends UserInputError {
  name = "UnsupportedFeatureError";
  statusText = "Unsupported feature";

  constructor(message: string) {
    super("Unsupported feature", message);
  }
}

export class InvalidTransactionError extends UserInputError {
  name = "InvalidTransactionError";
  status = 400;
  statusText = "Invalid transaction";
  adamikStatus: Status;

  constructor(adamikStatus: Status) {
    super("Invalid transaction");
    this.adamikStatus = adamikStatus;
  }
}

export class TransactionIdNotFoundError extends UserInputError {
  name = "TransactionIdNotFoundError";
  status = 400;
  statusText = "TransactionId not found";

  constructor(transactionId: string, chainId: ChainId) {
    super("TransactionId not found", `Transaction ${transactionId} not found for chainId ${chainId}`);
  }
}

export class UnsupportedTokenIDError extends UserInputError {
  name = "UnsupportedTokenIDError";
  status = 400;
  statusText = "Unsupported tokenId";

  constructor(tokenId: any, chainId: ChainId) {
    super("Unsupported tokenId", `Token ID ${tokenId} is not supported for chain ID ${chainId}`);
  }
}

/**
 * Errors that don't seem to be caused by the user but that we still want to tell the user
 */
export class AdamikApiServerError extends AdamikHttpError {
  name = "AdamikApiServerError";
  statusText;
  status = 500;

  constructor(statusText: string, message?: string) {
    super(message);
    this.statusText = statusText;
  }
}
