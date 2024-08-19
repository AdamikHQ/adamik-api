import {
  AccountState,
  BroadcastStatus,
  ChainId,
  CompleteTransaction,
  Pagination,
  Token,
  Transaction,
  Validator,
} from "./types_WIP";

// TODO Doc (comment) for each function in every service

// BASE ////////////////////////////////////////////////////////////////////////////////////

abstract class BaseChainService {
  chainId: ChainId;

  constructor(chainId: ChainId) {
    this.chainId = chainId;
  }
  // Chain
  //abstract getChainParams(chainId: ChainId): Promise<ChainParams>; // For dynamic params?

  // Address
  abstract pubkeyToAddress(pubkey: string): Promise<string>;
  abstract validateAddress(address: string): Promise<boolean>;

  // Data
  abstract getAddressState(accountId: string): Promise<AccountState>;

  //abstract getAddressHistory(address: string): Promise<AddressHistory>;

  // Crafting
  // NOTE All of these functions will mutate the input 'Transaction' with additional info!
  // except for completeTransaction which will return a 'CompleteTransaction'
  // TODO: make new types ValidatedTransaction, EncodedTransaction... etc
  abstract prevalidateTransaction(transaction: Transaction): Promise<void>;
  abstract completeTransaction(transaction: Transaction): Promise<CompleteTransaction>;
  // TODO: should be a type guard:
  abstract validateTransaction(transaction: CompleteTransaction): Promise<void>;
  abstract encodeTransactionToSign(transaction: CompleteTransaction): Promise<void>;
  abstract encodeTransactionToBroadcast(signedTransaction: CompleteTransaction): Promise<string>;

  // Broadcast
  abstract broadcastTransaction(payload: string): Promise<BroadcastStatus>;
}

// STAKING ////////////////////////////////////////////////////////////////////////////////////

interface StakingService {
  getValidators(pagination?: Pagination): Promise<Validator[]>;
}

// Type predicate: checks that the input object implements the StakingService interface
function isStakingService(object: BaseChainService | StakingService): object is StakingService {
  // TS limitation: types don't exist at runtime, so this dummy
  // instance is necessary to extract members of the interface
  const dummy: StakingService = {
    getValidators: (): never => {
      throw new Error("Must not be used");
    },
  };
  const keys = Object.keys(dummy);
  return keys.reduce((valid, key) => valid && key in object, true);
}

// TOKENS ////////////////////////////////////////////////////////////////////////////////////

interface TokenService {
  getTokenInfo(tokenId: string): Promise<Token | null>;
}

// Type predicate: checks that the input object implements the TokenService interface
function isTokenService(object: BaseChainService | TokenService): object is TokenService {
  // TS limitation: types don't exist at runtime, so this dummy
  // instance is necessary to extract members of the interface
  const dummy: TokenService = {
    getTokenInfo: (): never => {
      throw new Error("Must not be used");
    },
  };
  const keys = Object.keys(dummy);
  return keys.reduce((valid, key) => valid && key in object, true);
}

// BATCHED BALANCES //////////////////////////////////////////////////////////////////////////

interface BatchedAccountStateService {
  getAddressesState(accountIds: string[]): Promise<AccountState>;
}

function isMultiBalancesService(
  object: BaseChainService | BatchedAccountStateService
): object is BatchedAccountStateService {
  // TS limitation: types don't exist at runtime, so this dummy
  // instance is necessary to extract members of the interface
  const dummy: BatchedAccountStateService = {
    getAddressesState: (): never => {
      throw new Error("Must not be used");
    },
  };
  const keys = Object.keys(dummy);
  return keys.reduce((valid, key) => valid && key in object, true);
}

export { BaseChainService, isMultiBalancesService, isStakingService, isTokenService };
export type { BatchedAccountStateService as MultiBalancesService, StakingService, TokenService };
