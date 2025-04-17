import { BaseChainService, StakingService, TokenService } from "~/app/model/service";
import { getAccountHistory as getAccountHistoryFn } from "./service/getAccountHistory";
import { getAccountState as getAccountStateFn } from "./service/getAccountState";
import { getAccountTokens as getAccountTokensFn } from "./service/getAccountTokens";
import { getTokenInfo as getTokenInfoFn } from "./service/getTokenInfo";
import { getTransaction as getTransactionFn } from "./service/getTransaction";
import { pubkeyToAddresses as pubkeyToAddressesFn } from "./service/pubkeyToAddresses";
import { validateAddress as validateAddressFn } from "./service/validateAddress";
import { prevalidateTransaction as prevalidateTransactionFn } from "./service/validateTransaction";
import { validateTransaction as validateTransactionFn } from "./service/validateTransaction";
import { encodeTransactionToSign as encodeTransactionToSignFn } from "./service/encodeTransaction";
import { getValidators as getValidatorsFn } from "./service/getValidators";
import { Transaction, Status } from "~/app/model/types_WIP";

class AptosService extends BaseChainService implements TokenService, StakingService {
  override pubkeyToAddresses = pubkeyToAddressesFn;
  override validateAddress = validateAddressFn;
  override getAccountState = getAccountStateFn;
  override getAccountHistory = getAccountHistoryFn;
  override getTransaction = getTransactionFn;
  override prevalidateTransaction = prevalidateTransactionFn;
  override validateTransaction = validateTransactionFn;
  override encodeTransactionToSign = encodeTransactionToSignFn;

  getAccountTokens = getAccountTokensFn;
  getValidators = getValidatorsFn;
  getTokenInfo = getTokenInfoFn;

  broadcastTransaction(_payload: string): Promise<string> {
    throw new Error("Unimplemented");
  }

  completeTransaction(_: { transaction: Transaction; status: Status }): Promise<void> {
    return Promise.resolve();
  }

  encodeTransactionToBroadcast(_: { signedTransaction: Transaction }): Promise<string> {
    throw new Error("Unimplemented");
  }
}

export { AptosService };
