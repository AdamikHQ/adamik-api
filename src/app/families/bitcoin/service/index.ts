import { BaseChainService } from "~/app/model/service";
import { broadcastTransaction } from "./broadcastTransaction";
import { completeTransaction } from "./completeTransaction";
import { encodeTransactionToBroadcast, encodeTransactionToSign } from "./encodeTransaction";
import { getAccountState } from "./getAccountState";
import { pubkeyToAddress } from "./pubkeyToAddress";
import { validateAddress } from "./validateAddress";
import { prevalidateTransaction, validateTransaction } from "./validateTransaction";

class BtcService extends BaseChainService {
  prevalidateTransaction = prevalidateTransaction;
  // FIXME: does this method makes any sense for BTC?
  pubkeyToAddress = pubkeyToAddress;
  validateAddress = validateAddress;
  getAccountState = getAccountState;
  //getAddressHistory = getAddressHistoryFn;
  completeTransaction = completeTransaction;
  validateTransaction = validateTransaction;
  encodeTransactionToSign = encodeTransactionToSign;
  encodeTransactionToBroadcast = encodeTransactionToBroadcast;
  broadcastTransaction = broadcastTransaction;
}

export { BtcService };
