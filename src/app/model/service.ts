import { AddressState, BroadcastStatus, ChainId, Token, Transaction } from "./types_WIP";
import { ValidatorResponse } from "./validator";

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
  abstract getAddressState(address: string): Promise<AddressState>;
  //abstract getAddressHistory(address: string): Promise<AddressHistory>;

  // Crafting
  // NOTE All of these functions will mutate the input 'Transaction' with additional info!
  abstract prevalidateTransaction(transaction: Transaction): Promise<void>;
  abstract completeTransaction(transaction: Transaction): Promise<void>;
  abstract validateTransaction(transaction: Transaction): Promise<void>;
  abstract encodeTransactionToSign(transaction: Transaction): Promise<void>;
  abstract encodeTransactionToBroadcast(signedTransaction: Transaction): Promise<string>;

  // Broadcast
  abstract broadcastTransaction(payload: string): Promise<BroadcastStatus>;
}

// STAKING ////////////////////////////////////////////////////////////////////////////////////

interface StakingService {
  getValidators(offset: number, limit: number): Promise<ValidatorResponse>;
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

export type { StakingService, TokenService };
export { BaseChainService, isStakingService, isTokenService };
