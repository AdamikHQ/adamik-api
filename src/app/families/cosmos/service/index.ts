import { ChainService } from "~/app/model/types_WIP";
import { pubkeyToAddress } from "./pubkeyToAddress";
import { validateAddress } from "./validateAddress";
import { getAddressState } from "./getAddressState";
//import { getAddressHistory } from "./getAddressHistory";
import { validateTransactionIntent, validateTransaction } from "./validateTransaction";
import { completeTransaction } from "./completeTransaction";
import { encodeTransactionToSign, encodeTransactionToBroadcast } from "./encodeTransaction";
import { broadcastTransaction } from "./broadcastTransaction";

const CosmosService: ChainService = {
  pubkeyToAddress,
  validateAddress,
  getAddressState,
  //getAddressHistory,
  validateTransactionIntent,
  validateTransaction,
  completeTransaction,
  encodeTransactionToSign,
  encodeTransactionToBroadcast,
  broadcastTransaction,
};

export { CosmosService };
