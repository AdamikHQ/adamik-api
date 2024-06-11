import { BaseChainService } from "~/app/model/service";
import { pubkeyToAddresses } from "./pubkeyToAddress";
import { validateAddress } from "./validateAddress";
import { getAddressState } from "./getAddressState";
import { validateTransaction, validateTransactionIntent } from "./validateTransaction";
import { completeTransaction } from "./completeTransaction";
import { encodeTransactionToBroadcast, encodeTransactionToSign } from "./encodeTransaction";
import { broadcastTransaction } from "./broadcastTransaction";

class BtcService extends BaseChainService {
  pubkeyToAddresses = pubkeyToAddresses;
  validateAddress = validateAddress;
  getAddressState = getAddressState;
  //getAddressHistory = getAddressHistoryFn;
  validateTransactionIntent = validateTransactionIntent;
  completeTransaction = completeTransaction;
  validateTransaction = validateTransaction;
  encodeTransactionToSign = encodeTransactionToSign;
  encodeTransactionToBroadcast = encodeTransactionToBroadcast;
  broadcastTransaction = broadcastTransaction;
}

export { BtcService };
