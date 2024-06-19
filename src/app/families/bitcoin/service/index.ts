import { BaseChainService } from "~/app/model/service";
import { pubkeyToAddresses } from "./pubkeyToAddress";
import { validateAddress } from "./validateAddress";
import { getAddressState } from "./getAddressState";
import { validateTransaction, validateTransactionIntent } from "./validateTransaction";
import { completeTransaction } from "./completeTransaction";
import { encodeTransactionToBroadcast, encodeTransactionToSign } from "./encodeTransaction";
import { broadcastTransaction } from "./broadcastTransaction";
import { Transaction } from "~/app/model/types_WIP";

class BtcService extends BaseChainService {
  prevalidateTransaction(transaction: Transaction): Promise<void> {
    throw new Error("Method not implemented.");
  }
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
