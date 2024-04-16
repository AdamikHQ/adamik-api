import { ChainService } from "~/app/model/types_WIP";
import { getAddressState } from "./getAddressState";
import { encodeTransactionToBroadcast, encodeTransactionToSign } from "./encodeTransaction";
import { broadcastTransaction } from "./broadcastTransaction";
import { completeTransaction } from "./completeTransaction";
import { pubkeyToAddress } from "./pubkeyToAddress";
import { validateAddress } from "./validateAddress";
import { validateTransaction, validateTransactionIntent } from "./validateTransaction";

const EthereumService: ChainService = {
  pubkeyToAddress,
  validateAddress,
  getAddressState,
  //getAddressHistory,
  // getValidators,
  validateTransactionIntent,
  validateTransaction,
  completeTransaction,
  encodeTransactionToSign,
  encodeTransactionToBroadcast,
  broadcastTransaction,
};

export { EthereumService };
