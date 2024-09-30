import { ValidationError } from "zod-validation-error";
import type { ChainId } from "~/app/model/types_WIP";

export abstract class AdamikHttpError extends ValidationError {
  abstract status: number;
  abstract statusText: string;
  constructor(message: string) {
    super(message);
  }
}

/**
 * This error should be the one used most of the time. Consider creating a custom error when reusing the same error message or statusText
 */
export class UserInputError extends AdamikHttpError {
  status = 400;
  statusText;
  constructor(message: string, statusText: string) {
    super(message);
    this.statusText = statusText;
  }
}

export class UnsupportedFeatureError extends AdamikHttpError {
  status = 400;
  statusText = "Unsupported feature";
  constructor(message: string) {
    super(message);
  }
}

export class UnsupportedTokenIDError extends AdamikHttpError {
  status = 400;
  statusText = "Unsupported tokenId";
  constructor(tokenId: any, chainId: ChainId) {
    super(`Token ID ${tokenId} is not supported for chain ID ${chainId}`);
  }
}
