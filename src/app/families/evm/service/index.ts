import { BaseChainService, TokenService } from "~/app/model/service";
import { broadcastTransaction as broadcastTransactionFn } from "./broadcastTransaction";
import { completeTransaction as completeTransactionFn } from "./completeTransaction";
import {
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
  encodeTransactionToSign as encodeTransactionToSignFn,
} from "./encodeTransaction";
import { getAddressState as getAddressStateFn } from "./getAddressState";
import { getTokenInfo as getTokenInfoFn } from "./getTokenInfo";
import { pubkeyToAddress as pubkeyToAddressFn } from "./pubkeyToAddress";
import { validateAddress as validateAddressFn } from "./validateAddress";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./validateTransaction";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

class EvmService extends BaseChainService implements TokenService {
  getTokenInfo = getTokenInfoFn;
  pubkeyToAddress = pubkeyToAddressFn;
  validateAddress = validateAddressFn;
  getAddressState = getAddressStateFn;
  prevalidateTransaction = this.transactionMethodAdaptator(prevalidateTransactionFn);
  completeTransaction = this.transactionMethodAdaptator(completeTransactionFn);
  validateTransaction = this.transactionMethodAdaptator(validateTransactionFn);
  encodeTransactionToSign = this.transactionMethodAdaptator(encodeTransactionToSignFn);
  encodeTransactionToBroadcast = this.transactionMethodAdaptator(encodeTransactionToBroadcastFn);
  broadcastTransaction = broadcastTransactionFn;
}

export { EvmService };
