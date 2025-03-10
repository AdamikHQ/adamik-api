import { BaseChainService, TokenService } from "~/app/model/service";
import { broadcastTransaction as broadcastTransactionFn } from "./service/broadcastTransaction";
import { completeTransaction as completeTransactionFn } from "./service/completeTransaction";
import {
  encodeTransactionToBroadcast as encodeTransactionToBroadcastFn,
  encodeTransactionToSign as encodeTransactionToSignFn,
} from "./service/encodeTransaction";
import { getAccountHistory as getAccountHistoryFn } from "./service/getAccountHistory";
import { getAccountState as getAccountStateFn } from "./service/getAccountState";
import { getAccountTokens as getAccountTokensFn } from "./service/getAccountTokens";
import { getTokenInfo as getTokenInfoFn } from "./service/getTokenInfo";
import { getTransaction as getTransactionFn } from "./service/getTransaction";
import { pubkeyToAddresses as pubkeyToAddressesFn } from "./service/pubkeyToAddresses";
import { validateAddress as validateAddressFn } from "./service/validateAddress";
import {
  prevalidateTransaction as prevalidateTransactionFn,
  validateTransaction as validateTransactionFn,
} from "./service/validateTransaction";
import { ProviderType } from "~/app/model/types_WIP";
import { MoralisIndexer } from "~/app/families/evm/backend/moralis";
import { AlchemyIndexer } from "~/app/families/evm/backend/alchemy";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

class EvmService extends BaseChainService implements TokenService {
  override pubkeyToAddresses = pubkeyToAddressesFn;
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

  getIndexer() {
    if (this.getBackend(ProviderType.moralis)) {
      return MoralisIndexer;
    }
    if (this.getBackend(ProviderType.alchemy)) {
      return AlchemyIndexer;
    }
    throw new UnsupportedFeatureError(`Unsupported feature for chain ${this.chainId}`);
  }

  getAccountTokens = getAccountTokensFn;
  getTokenInfo = getTokenInfoFn;
}

export { EvmService };
