import { BaseChainService } from "~/app/model/service";
import { broadcastTransaction as broadcastTransactionFn } from "./broadcastTransaction";
import { completeTransaction as completeTransactionFn } from "./completeTransaction";
import {
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
  encodeTransactionToSign as encodeTransactionToSignFn,
} from "./encodeTransaction";
import { getAccountState as getAccountStateFn } from "./getAccountState";
import { getTransaction as getTransactionFn } from "./getTransaction";
import { pubkeyToAddresses as pubkeyToAddressesFn } from "./pubkeyToAddresses";
import { validateAddress as validateAddressFn } from "./validateAddress";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./validateTransaction";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

class TronService extends BaseChainService {
  override pubkeyToAddresses = pubkeyToAddressesFn;
  override validateAddress = validateAddressFn;
  override getAccountState = getAccountStateFn;
  override getTransaction = getTransactionFn;
  override prevalidateTransaction = prevalidateTransactionFn;
  override completeTransaction = completeTransactionFn;
  override validateTransaction = validateTransactionFn;
  override encodeTransactionToSign = encodeTransactionToSignFn;
  override encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  override broadcastTransaction = broadcastTransactionFn;
}

export { TronService };
