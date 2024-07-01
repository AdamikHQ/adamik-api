import {
  AddressState,
  AddressesState,
  BroadcastStatus,
  ChainId,
  Pagination,
  StateOrigin,
  Token,
  Transaction,
  TransactionMode,
  TransactionWrapper,
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
  abstract getAddressState(origin: StateOrigin): Promise<AddressState>;

  //abstract getAddressHistory(address: string): Promise<AddressHistory>;

  // Crafting
  // NOTE All of these functions will mutate the input 'TransactionWrapper' with additional info!
  abstract prevalidateTransaction(transaction: TransactionWrapper): Promise<void>;
  abstract completeTransaction(transaction: TransactionWrapper): Promise<void>;
  abstract validateTransaction(transaction: TransactionWrapper): Promise<void>;
  abstract encodeTransactionToSign(transaction: TransactionWrapper): Promise<void>;
  abstract encodeTransactionToBroadcast(signedTransaction: TransactionWrapper): Promise<string>;

  // Broadcast
  abstract broadcastTransaction(payload: string): Promise<BroadcastStatus>;

  // Helper function for services that were coded with `Transaction` instead of `TransactionWrapper`
  protected transactionMethodAdaptator<T>(fn: (transaction: Transaction) => Promise<T>): (transaction: TransactionWrapper) => Promise<T> {
    return (transaction: TransactionWrapper): Promise<T> => {
      if (
        transaction.plain.mode === TransactionMode.DELEGATE ||
        transaction.plain.mode === TransactionMode.TRANSFER ||
        transaction.plain.mode === TransactionMode.TRANSFER_TOKEN
      ) {
        return fn(transaction as Transaction);
      }
      throw new Error(`Unsupported transaction mode: ${transaction.plain.mode} for chain ID ${this.chainId}`);
    };
  };

  // Helper function for services that were coded with `string` instead of `StateOrigin`
  //   FIXME: using generics + cast to work around EVM `EvmAddress` specificity
  protected addressStateMethodAdaptator<T extends string>(fn: (address: T) => Promise<AddressState>): (stateOrigin: StateOrigin) => Promise<AddressState> {
    return (stateOrigin: StateOrigin): Promise<AddressState> => {
      if ("address" in stateOrigin) {
        return fn(stateOrigin.address as T);
      }
      throw new Error(`Unsupported state origin xpub for chain ID ${this.chainId}`);
    }
  };
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

// MULTI BALANCES //////////////////////////////////////////////////////////////////////////

interface MultiBalancesService {
  getAddressesState(addresses: string[]): Promise<AddressesState>;
  getAddressState(address: StateOrigin): Promise<AddressState>;
}

function isMultiBalancesService(object: BaseChainService | MultiBalancesService): object is MultiBalancesService {
  // TS limitation: types don't exist at runtime, so this dummy
  // instance is necessary to extract members of the interface
  const dummy: MultiBalancesService = {
    getAddressesState: (): never => {
      throw new Error("Must not be used");
    },
    getAddressState: (): never => {
      throw new Error("Must not be used");
    },
  };
  const keys = Object.keys(dummy);
  return keys.reduce((valid, key) => valid && key in object, true);
}

export type { StakingService, TokenService, MultiBalancesService };
export { BaseChainService, isStakingService, isTokenService, isMultiBalancesService };
