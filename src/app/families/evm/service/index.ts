import { BaseChainService, TokenService } from "~/app/model/service";
import { getTokenInfo as getTokenInfoFn } from "./getTokenInfo";
import { pubkeyToAddress as pubkeyToAddressFn } from "./pubkeyToAddress";
import { validateAddress as validateAddressFn } from "./validateAddress";
import { getAddressState as getAddressStateFn } from "./getAddressState";
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

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

class EvmService extends BaseChainService implements TokenService {
  getTokenInfo = getTokenInfoFn;
  pubkeyToAddress = pubkeyToAddressFn;
  validateAddress = validateAddressFn;
  getAddressState = this.addressStateMethodAdaptator(getAddressStateFn);
  prevalidateTransaction = this.transactionMethodAdaptator(prevalidateTransactionFn);
  completeTransaction = completeTransactionFn;
  validateTransaction = validateTransactionFn;
  encodeTransactionToSign = encodeTransactionToSignFn;
  encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  broadcastTransaction = broadcastTransactionFn;
}

export { EvmService };
