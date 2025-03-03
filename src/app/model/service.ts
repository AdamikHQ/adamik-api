import {
  AccountHistory,
  AccountState,
  AccountTokens,
  Backend,
  Chain,
  ChainId,
  ChainValidators,
  FinalizedTransaction,
  Paginated,
  ProviderType,
  Status,
  Token,
  Transaction,
  TypedAddress,
} from "./types_WIP";
import { CHAINS } from "~/app/config/chains";

// TODO Doc (comment) for each function in every service

// BASE ////////////////////////////////////////////////////////////////////////////////////

abstract class BaseChainService {
  chainId: ChainId;
  chain: Chain;
  backends: Backend[];

  constructor(chainId: ChainId) {
    this.chainId = chainId;
    this.chain = CHAINS[chainId];
    this.backends = this.chain.backends;
  }

  getBackend(type: ProviderType): Backend | null {
    return this.backends.find((b: Backend) => b.providerType === type) ?? null;
  }
  // Chain
  //abstract getChainParams(chainId: ChainId): Promise<ChainParams>; // For dynamic params?

  // Address
  abstract pubkeyToAddresses(pubkey: string): Promise<TypedAddress[]>;
  abstract validateAddress(address: string): Promise<boolean>;

  // Data
  abstract getTransaction(transactionId: string, status: Status): Promise<FinalizedTransaction>;
  abstract getAccountState(accountId: string): Promise<AccountState>;
  abstract getAccountHistory(accountId: string, paginationToken?: string): Promise<Paginated<AccountHistory>>;

  // Crafting
  // NOTE All of these functions will mutate the input 'Transaction' and 'Status' with additional info!
  // The single object param allows to use both as const, so at least their reference cannot be overwritten
  abstract prevalidateTransaction(_: { transaction: Transaction; status: Status }): Promise<void>;
  abstract completeTransaction(_: { transaction: Transaction; status: Status }): Promise<void>;
  abstract validateTransaction(_: { transaction: Transaction; status: Status }): Promise<void>;
  abstract encodeTransactionToSign(_: { transaction: Transaction; status: Status }): Promise<void>;
  abstract encodeTransactionToBroadcast(_: { signedTransaction: Transaction }): Promise<string>;

  // Broadcast
  abstract broadcastTransaction(payload: string): Promise<string>;
}

// STAKING ////////////////////////////////////////////////////////////////////////////////////

interface StakingService {
  getValidators(paginationToken?: string): Promise<Paginated<ChainValidators>>;
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
  getAccountTokens(accountId: string, paginationToken?: string): Promise<Paginated<AccountTokens>>;
}

// Type predicate: checks that the input object implements the TokenService interface
function isTokenService(object: BaseChainService | TokenService): object is TokenService {
  // TS limitation: types don't exist at runtime, so this dummy
  // instance is necessary to extract members of the interface
  const dummy: TokenService = {
    getTokenInfo: (): never => {
      throw new Error("Must not be used");
    },
    getAccountTokens: (): never => {
      throw new Error("Must not be used");
    },
  };
  const keys = Object.keys(dummy);
  return keys.reduce((valid, key) => valid && key in object, true);
}

export { BaseChainService, isStakingService, isTokenService };
export type { StakingService, TokenService };
