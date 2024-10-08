import type { AdamikStatus } from "../tools/handlers/apiHandler";
import {
  AccountState,
  BroadcastStatus,
  ChainId,
  FinalizedTransaction,
  Pagination,
  Token,
  Transaction,
  TypedAddress,
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
  abstract pubkeyToAddresses(pubkey: string): Promise<TypedAddress[]>;
  abstract validateAddress(address: string): Promise<boolean>;

  // Data
  abstract getTransaction(transactionId: string, status: AdamikStatus): Promise<FinalizedTransaction>;
  abstract getAccountState(accountId: string): Promise<AccountState>;
  //abstract getAddressesState(addresses: string[]): Promise<AccountState[]>;
  //abstract getAddressHistory(address: string): Promise<AddressHistory>;

  // Crafting
  // NOTE All of these functions will mutate the input 'Transaction' with additional info!
  abstract prevalidateTransaction(transaction: Transaction, status: AdamikStatus): Promise<void>;
  abstract completeTransaction(transaction: Transaction, status: AdamikStatus): Promise<void>;
  abstract validateTransaction(transaction: Transaction, status: AdamikStatus): Promise<void>;
  abstract encodeTransactionToSign(transaction: Transaction, status: AdamikStatus): Promise<void>;
  abstract encodeTransactionToBroadcast(signedTransaction: Transaction): Promise<string>;

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
  getTokenInfo(tokenId: string): Promise<Token>;
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

export { BaseChainService, isStakingService, isTokenService };
export type { StakingService, TokenService };
