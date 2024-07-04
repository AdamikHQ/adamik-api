import { BaseChainService, StakingService, TokenService } from "~/app/model/service";
import { pubkeyToAddress as pubkeyToAddressFn } from "./pubkeyToAddress";
import { validateAddress as validateAddressFn } from "./validateAddress";
import { getAddressState as getAddressStateFn } from "./getAddressState";
import { getTokenInfo as getTokenInfoFn } from "./getTokenInfo";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./validateTransaction";
import { completeTransaction as completeTransactionFn } from "./completeTransaction";
import {
  encodeTransactionToSign as encodeTransactionToSignFn,
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
} from "./encodeTransaction";
import { broadcastTransaction as broadcastTransactionFn } from "./broadcastTransaction";
import { getValidators as getValidatorsFn } from "./getValidators";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

class CosmosService extends BaseChainService implements TokenService, StakingService {
  pubkeyToAddress = pubkeyToAddressFn;
  validateAddress = validateAddressFn;
  getAddressState = this.addressStateMethodAdaptator(getAddressStateFn);
  getTokenInfo = getTokenInfoFn;
  getValidators = getValidatorsFn;
  prevalidateTransaction = this.transactionMethodAdaptator(prevalidateTransactionFn);
  completeTransaction = this.transactionMethodAdaptator(completeTransactionFn);
  validateTransaction = this.transactionMethodAdaptator(validateTransactionFn);
  encodeTransactionToSign = this.transactionMethodAdaptator(encodeTransactionToSignFn);
  encodeTransactionToBroadcast = this.transactionMethodAdaptator(encodeTransactionToBroadcastFn);
  broadcastTransaction = broadcastTransactionFn;
}

export { CosmosService };
