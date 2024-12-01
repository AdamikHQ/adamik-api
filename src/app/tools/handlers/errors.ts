import type { ChainId, Status } from "~/app/model/types_WIP";

export abstract class AdamikHttpError extends Error {
  abstract statusText: string;
  abstract status: number;

  constructor(message?: string) {
    super(message);
  }
}

// FIXME Should this make the distinction with UnsupportedFeatureError ?
/*
export class NotImplementedError extends AdamikHttpError {
  name = "NotImplementedError";
  statusText = "Not implemented";
  status = 500;

  constructor(message: string) {
    super(message);
  }
}
*/

export class ThirdPartyProviderError extends AdamikHttpError {
  name = "ThirdPartyProviderError";
  statusText = "Third Party Provider Error";
  status = 500;

  constructor(message?: string) {
    super(message);
  }
}

/**
 * This error should be the one used most of the time. Consider creating a custom error when reusing the same error message or statusText
 */
export class UserInputError extends AdamikHttpError {
  name = "UserInputError";
  statusText = "Invalid or missing fields";
  status = 400;

  constructor(message: string) {
    super(message);
  }
}

export class UnsupportedFeatureError extends UserInputError {
  name = "UnsupportedFeatureError";
  statusText = "Unsupported feature";

  constructor(message: string) {
    super(message);
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
    super(`Transaction ${transactionId} not found for chainId ${chainId}`);
  }
}

export class UnsupportedTokenIDError extends UserInputError {
  name = "UnsupportedTokenIDError";
  status = 400;
  statusText = "Unsupported tokenId";

  constructor(tokenId: any, chainId: ChainId) {
    super(`Token ID ${tokenId} is not supported for chain ID ${chainId}`);
  }
}

export class InvalidPaginationTokenError extends UserInputError {
  name = "InvalidPaginationTokenError";
  statusText = "Invalid pagination token";

  constructor(message: string) {
    super(message);
  }
}

/**
 * Errors that don't seem to be caused by the user but that we still want to tell the user
 */
export class AdamikApiServerError extends AdamikHttpError {
  name = "AdamikApiServerError";
  statusText = "Internal Error";
  status = 500;

  constructor(message: string) {
    super(message);
  }
}
