import { BaseChainService, StakingService, TokenService } from "~/app/model/service";
import { getAccountHistory as getAccountHistoryFn } from "./service/getAccountHistory";
import { getAccountState as getAccountStateFn } from "./service/getAccountState";
import { getAccountTokens as getAccountTokensFn } from "./service/getAccountTokens";
import { getTokenInfo as getTokenInfoFn } from "./service/getTokenInfo";
import { getTransaction as getTransactionFn } from "./service/getTransaction";
import { pubkeyToAddresses as pubkeyToAddressesFn } from "./service/pubkeyToAddresses";
import { validateAddress as validateAddressFn } from "./service/validateAddress";
import { prevalidateTransaction as prevalidateTransactionFn } from "./service/validateTransaction";
import { completeTransaction as completeTransactionFn } from "./service/completeTransaction";
import { validateTransaction as validateTransactionFn } from "./service/validateTransaction";
import {
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
  encodeTransactionToSign as encodeTransactionToSignFn,
} from "./service/encodeTransaction";
import { getValidators as getValidatorsFn } from "./service/getValidators";
import { broadcastTransaction as broadcastTransactionFn } from "./service/broadcastTransaction";

class AptosService extends BaseChainService implements TokenService, StakingService {
  override pubkeyToAddresses = pubkeyToAddressesFn;
  override validateAddress = validateAddressFn;
  override getAccountState = getAccountStateFn;
  override getAccountHistory = getAccountHistoryFn;
  override getTransaction = getTransactionFn;
  override prevalidateTransaction = prevalidateTransactionFn;
  override validateTransaction = validateTransactionFn;
  override encodeTransactionToSign = encodeTransactionToSignFn;
  override encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  override completeTransaction = completeTransactionFn;
  override broadcastTransaction = broadcastTransactionFn;

  getAccountTokens = getAccountTokensFn;
  getValidators = getValidatorsFn;
  getTokenInfo = getTokenInfoFn;
}

export { AptosService };
