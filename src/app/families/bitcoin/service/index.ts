import { BaseChainService, MultiBalancesService } from "~/app/model/service";
import { TransactionWrapper } from "~/app/model/types_WIP";
import { broadcastTransaction } from "./broadcastTransaction";
import { completeTransaction } from "./completeTransaction";
import { encodeTransactionToBroadcast, encodeTransactionToSign } from "./encodeTransaction";
import { getAddressState, getAddressesState } from "./getAddressesState";
import { pubkeyToAddress } from "./pubkeyToAddress";
import { validateAddress } from "./validateAddress";
import { validateTransaction } from "./validateTransaction";

class BtcService extends BaseChainService implements MultiBalancesService {
  prevalidateTransaction(transaction: TransactionWrapper): Promise<void> {
    throw new Error("Method not implemented.");
  }
  // FIXME: does this method makes any sense for BTC?
  pubkeyToAddress = pubkeyToAddress;
  validateAddress = validateAddress;
  getAddressState = getAddressState;
  getAddressesState = getAddressesState;
  //getAddressHistory = getAddressHistoryFn;
  completeTransaction = completeTransaction;
  validateTransaction = validateTransaction;
  encodeTransactionToSign = encodeTransactionToSign;
  encodeTransactionToBroadcast = encodeTransactionToBroadcast;
  broadcastTransaction = broadcastTransaction;
}

export { BtcService };
