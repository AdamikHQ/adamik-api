import { ChainService } from "~/app/model/types_WIP";
import { pubkeyToAddress } from "./pubkeyToAddress";
import { validateAddress } from "./validateAddress";
import { getAddressState } from "./getAddressState";
//import { getAddressHistory } from "./getAddressHistory";
import { validateTransactionIntent, validateTransaction } from "./validateTransaction";
import { completeTransaction } from "./completeTransaction";
import { encodeTransactionToSign, encodeTransactionToBroadcast } from "./encodeTransaction";
import { broadcastTransaction } from "./broadcastTransaction";
import { getValidators } from "./getValidators";
import { CosmosValidator } from "../backend/types";

const CosmosService: ChainService<CosmosValidator> = {
  pubkeyToAddress,
  validateAddress,
  getAddressState,
  //getAddressHistory,
  getValidators,
  validateTransactionIntent,
  validateTransaction,
  completeTransaction,
  encodeTransactionToSign,
  encodeTransactionToBroadcast,
  broadcastTransaction,
};

export { CosmosService };
