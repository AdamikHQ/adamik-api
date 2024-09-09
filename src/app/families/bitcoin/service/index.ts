import { BaseChainService } from "~/app/model/service";
import { broadcastTransaction as broadcastTransactionFn } from "./broadcastTransaction";
import { completeTransaction as completeTransactionFn } from "./completeTransaction";
import {
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
  encodeTransactionToSign as encodeTransactionToSignFn,
} from "./encodeTransaction";
import { getAccountState as getAccountStateFn } from "./getAccountState";
import { getTransaction as getTransactionFn } from "./getTransaction";
import { pubkeyToAddress as pubkeyToAddressFn } from "./pubkeyToAddress";
import { validateAddress as validateAddressFn } from "./validateAddress";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./validateTransaction";

class BitcoinService extends BaseChainService {
  prevalidateTransaction = prevalidateTransactionFn;
  // FIXME: does this method makes any sense for BTC?
  pubkeyToAddress = pubkeyToAddressFn;
  validateAddress = validateAddressFn;
  getAccountState = getAccountStateFn;
  getTransaction = getTransactionFn;
  //getAddressHistory = getAddressHistoryFn;
  completeTransaction = completeTransactionFn;
  validateTransaction = validateTransactionFn;
  encodeTransactionToSign = encodeTransactionToSignFn;
  encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  broadcastTransaction = broadcastTransactionFn;
}

export { BitcoinService };
