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
import { pubkeyToAddresses as pubkeyToAddressesFn } from "./pubkeyToAddresses";
import { validateAddress as validateAddressFn } from "./validateAddress";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./validateTransaction";

class BitcoinService extends BaseChainService {
  override prevalidateTransaction = prevalidateTransactionFn;
  // FIXME: does this method makes any sense for BTC?
  override pubkeyToAddress = pubkeyToAddressFn;
  override validateAddress = validateAddressFn;
  override getAccountState = getAccountStateFn;
  override getTransaction = getTransactionFn;
  //getAddressHistory = getAddressHistoryFn;
  override completeTransaction = completeTransactionFn;
  override validateTransaction = validateTransactionFn;
  override encodeTransactionToSign = encodeTransactionToSignFn;
  override encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  override broadcastTransaction = broadcastTransactionFn;
  pubkeyToAddresses = pubkeyToAddressesFn;
}

export { BitcoinService };

