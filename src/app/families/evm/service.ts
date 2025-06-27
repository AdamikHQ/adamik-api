import { AlchemyIndexer } from "~/app/families/evm/backend/alchemy";
import { MoralisIndexer } from "~/app/families/evm/backend/moralis";
import { EvmIndexer } from "~/app/families/evm/backend/types";
import { BaseChainService, StakingService, TokenService } from "~/app/model/service";
import { ProviderType } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
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

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

class EvmService extends BaseChainService implements TokenService, StakingService {
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

  getIndexer(): EvmIndexer {
    if (this.getProvider(ProviderType.moralis)) {
      return MoralisIndexer;
    }
    if (this.getProvider(ProviderType.alchemy)) {
      return AlchemyIndexer;
    }
    throw new UnsupportedFeatureError(`Unsupported feature for chain ${this.chainId}`);
  }

  getAccountTokens = getAccountTokensFn;
  getTokenInfo = getTokenInfoFn;
  getValidators = () => {
    throw new UnsupportedFeatureError(`Unsupported feature for chain ${this.chainId}`);
  };
}

export { EvmService };
