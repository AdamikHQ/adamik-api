import { BaseChainService, TokenService } from "~/app/model/service";
import { getTokenInfo as getTokenInfoFn } from "./getTokenInfo";
import { pubkeyToAddress as pubkeyToAddressFn } from "./pubkeyToAddress";
import { validateAddress as validateAddressFn } from "./validateAddress";
import { getAddressState as getAddressStateFn } from "./getAddressState";
//import { getAddressHistory as getAddressHistoryFn } from "./getAddressHistory";
import {
  validateTransactionIntent as validateTransactionIntentFn,
  validateTransaction as validateTransactionFn,
} from "./validateTransaction";
import { completeTransaction as completeTransactionFn } from "./completeTransaction";
import {
  encodeTransactionToSign as encodeTransactionToSignFn,
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
} from "./encodeTransaction";
import { broadcastTransaction as broadcastTransactionFn } from "./broadcastTransaction";

class AlgorandService extends BaseChainService implements TokenService {
  getTokenInfo = getTokenInfoFn;
  pubkeyToAddress = pubkeyToAddressFn;
  validateAddress = validateAddressFn;
  getAddressState = getAddressStateFn;
  //getAddressHistory = getAddressHistoryFn;
  validateTransactionIntent = validateTransactionIntentFn;
  completeTransaction = completeTransactionFn;
  validateTransaction = validateTransactionFn;
  encodeTransactionToSign = encodeTransactionToSignFn;
  encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  broadcastTransaction = broadcastTransactionFn;
}

export { AlgorandService };
