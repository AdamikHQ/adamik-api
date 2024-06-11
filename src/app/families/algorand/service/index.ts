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

class AlgorandService extends BaseChainService implements TokenService {
  getTokenInfo = getTokenInfoFn;
  pubkeyToAddresses = pubkeyToAddressFn;
  validateAddress = validateAddressFn;
  getAddressState = getAddressStateFn;
  prevalidateTransaction = prevalidateTransactionFn;
  completeTransaction = completeTransactionFn;
  validateTransaction = validateTransactionFn;
  encodeTransactionToSign = encodeTransactionToSignFn;
  encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  broadcastTransaction = broadcastTransactionFn;
}

export { AlgorandService };
