import { BaseChainService, StakingService, TokenService } from "~/app/model/service";
import { broadcastTransaction as broadcastTransactionFn } from "./service/broadcastTransaction";
import { completeTransaction as completeTransactionFn } from "./service/completeTransaction";
import {
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
  encodeTransactionToSign as encodeTransactionToSignFn,
} from "./service/encodeTransaction";
import { getAccountHistory as getAccountHistoryFn } from "./service/getAccountHistory";
import { getAccountState as getAccountStateFn } from "./service/getAccountState";
import { getTokenInfo as getTokenInfoFn } from "./service/getTokenInfo";
import { getTransaction as getTransactionFn } from "./service/getTransaction";
import { getValidators as getValidatorsFn } from "./service/getValidators";
import { pubkeyToAddresses as pubkeyToAddressesFn } from "./service/pubkeyToAddresses";
import { validateAddress as validateAddressFn } from "./service/validateAddress";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./service/validateTransaction";

class CosmosService extends BaseChainService implements TokenService, StakingService {
  override pubkeyToAddresses = pubkeyToAddressesFn.bind(this);
  override validateAddress = validateAddressFn;
  override getAccountState = getAccountStateFn;
  override getAccountHistory = getAccountHistoryFn;
  override getTransaction = getTransactionFn;
  override prevalidateTransaction = prevalidateTransactionFn;
  override completeTransaction = completeTransactionFn;
  override validateTransaction = validateTransactionFn;
  override encodeTransactionToSign = encodeTransactionToSignFn;
  override encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  override broadcastTransaction = broadcastTransactionFn;

  getTokenInfo = getTokenInfoFn;
  getValidators = getValidatorsFn;
}

export { CosmosService };
