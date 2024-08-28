import { BaseChainService, TokenService } from "~/app/model/service";
import { pubkeyToAddresses as pubkeyToAddressesFn } from "../pubkeyToAddresses";
import { broadcastTransaction as broadcastTransactionFn } from "./broadcastTransaction";
import { completeTransaction as completeTransactionFn } from "./completeTransaction";
import {
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
  encodeTransactionToSign as encodeTransactionToSignFn,
} from "./encodeTransaction";
import { getAccountState as getAccountStateFn } from "./getAccountState";
import { getTokenInfo as getTokenInfoFn } from "./getTokenInfo";
import { pubkeyToAddress as pubkeyToAddressFn } from "./pubkeyToAddress";
import { validateAddress as validateAddressFn } from "./validateAddress";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./validateTransaction";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

class TonService extends BaseChainService implements TokenService {
  pubkeyToAddress = pubkeyToAddressFn;
  validateAddress = validateAddressFn;
  getAccountState = getAccountStateFn;
  prevalidateTransaction = prevalidateTransactionFn;
  completeTransaction = completeTransactionFn;
  validateTransaction = validateTransactionFn;
  encodeTransactionToSign = encodeTransactionToSignFn;
  encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  broadcastTransaction = broadcastTransactionFn;
  pubkeyToAddresses = pubkeyToAddressesFn;
  getTokenInfo = getTokenInfoFn;
}

export { TonService };
