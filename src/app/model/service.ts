import {
  AddressState,
  AddressesState,
  BroadcastStatus,
  ChainId,
  Pagination,
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
  abstract getAddressState(accountId: string): Promise<AddressState>;

  //abstract getAddressHistory(address: string): Promise<AddressHistory>;

  // Crafting
  // NOTE All of these functions will mutate the input 'TransactionWrapper' with additional info!
  abstract prevalidateTransaction(transaction: TransactionWrapper): Promise<void>;
  abstract completeTransaction(transaction: TransactionWrapper): Promise<void>;
  // TODO: should be a type guard: 
  abstract validateTransaction(transaction: TransactionWrapper): Promise<void>;
  abstract encodeTransactionToSign(transaction: TransactionWrapper): Promise<void>;
  abstract encodeTransactionToBroadcast(signedTransaction: TransactionWrapper): Promise<string>;

  // Broadcast
  abstract broadcastTransaction(payload: string): Promise<BroadcastStatus>;

  // Helper function for services that were coded with `Transaction` instead of `TransactionWrapper`
  protected transactionMethodAdaptator<T>(fn: (transaction: Transaction) => Promise<T>): (transaction: TransactionWrapper) => Promise<T> {
    return (transaction: TransactionWrapper): Promise<T> => {
      if (
        transaction.data.mode === TransactionMode.DELEGATE ||
        transaction.data.mode === TransactionMode.TRANSFER ||
        transaction.data.mode === TransactionMode.TRANSFER_TOKEN
      ) {
        const old_transaction_format: Transaction = {
          plain: transaction.data,
          status: transaction.status,
        };
        return fn.bind(this)(old_transaction_format);
      }
      throw new Error(`Unsupported transaction mode: ${transaction.data.mode} for chain ID ${this.chainId}`);
    };
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
}

function isMultiBalancesService(object: BaseChainService | MultiBalancesService): object is MultiBalancesService {
  // TS limitation: types don't exist at runtime, so this dummy
  // instance is necessary to extract members of the interface
  const dummy: MultiBalancesService = {
    getAddressesState: (): never => {
      throw new Error("Must not be used");
    },
  };
  const keys = Object.keys(dummy);
  return keys.reduce((valid, key) => valid && key in object, true);
}

export type { StakingService, TokenService, MultiBalancesService };
export { BaseChainService, isStakingService, isTokenService, isMultiBalancesService };
