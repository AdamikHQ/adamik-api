import { BaseChainService, StakingService, TokenService } from "~/app/model/service";
import { broadcastTransaction as broadcastTransactionFn } from "./broadcastTransaction";
import { completeTransaction as completeTransactionFn } from "./completeTransaction";
import {
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
  encodeTransactionToSign as encodeTransactionToSignFn,
} from "./encodeTransaction";
import { getAccountState as getAccountStateFn } from "./getAccountState";
import { getTokenInfo as getTokenInfoFn } from "./getTokenInfo";
import { getTransaction as getTransactionFn } from "./getTransaction";
import { getValidators as getValidatorsFn } from "./getValidators";
import { pubkeyToAddress as pubkeyToAddressFn } from "./pubkeyToAddress";
import { pubkeyToAddresses as pubkeyToAddressesFn } from "./pubkeyToAddresses";
import { validateAddress as validateAddressFn } from "./validateAddress";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./validateTransaction";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

class CosmosService extends BaseChainService implements TokenService, StakingService {
  override pubkeyToAddress = pubkeyToAddressFn;
  override validateAddress = validateAddressFn;
  override getAccountState = getAccountStateFn;
  override getTransaction = getTransactionFn;
  override prevalidateTransaction = prevalidateTransactionFn;
  override completeTransaction = completeTransactionFn;
  override validateTransaction = validateTransactionFn;
  override encodeTransactionToSign = encodeTransactionToSignFn;
  override encodeTransactionToBroadcast = encodeTransactionToBroadcastFn;
  override broadcastTransaction = broadcastTransactionFn;

  getTokenInfo = getTokenInfoFn;
  getValidators = getValidatorsFn;
  pubkeyToAddresses = pubkeyToAddressesFn;
}

export { CosmosService };

