import { BaseChainService, MultiBalancesService } from "~/app/model/service";
import { pubkeyToAddress } from "./pubkeyToAddress";
import { validateAddress } from "./validateAddress";
import { getAddressesState } from "./getAddressesState";
import { validateTransaction } from "./validateTransaction";
import { completeTransaction } from "./completeTransaction";
import { encodeTransactionToBroadcast, encodeTransactionToSign } from "./encodeTransaction";
import { broadcastTransaction } from "./broadcastTransaction";
import { AddressState, Transaction } from "~/app/model/types_WIP";

class BtcService extends BaseChainService implements MultiBalancesService {
  getAddressState(stateOrigin: string | { address: string; } | { xpub: string; }): Promise<AddressState> {
    // FIXME: check if it's an address or an xpub
    return this.getAddressesState([stateOrigin as string]).then((addressesState): AddressState => {
      return {
        chainId: this.chainId,
        address: stateOrigin as string,
        balances: addressesState.addresses[stateOrigin as string].balances,
      }
    });
  }
  prevalidateTransaction(transaction: Transaction): Promise<void> {
    throw new Error("Method not implemented.");
  }
  // FIXME: does this method makes any sense for BTC?
  pubkeyToAddress = pubkeyToAddress;
  validateAddress = validateAddress;
  getAddressesState = getAddressesState;
  //getAddressHistory = getAddressHistoryFn;
  completeTransaction = completeTransaction;
  validateTransaction = validateTransaction;
  encodeTransactionToSign = encodeTransactionToSign;
  encodeTransactionToBroadcast = encodeTransactionToBroadcast;
  broadcastTransaction = broadcastTransaction;
}

export { BtcService };
