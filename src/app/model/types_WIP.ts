import { CosmosParams } from "../families/cosmos/constants";
import { ValidatorResponse } from "./validator";

// FIXME Can't be validated at runtime!
//type ChainId = "algorand" | "cosmoshub";

enum ChainId {
  ALGORAND = "algorand",
  COSMOSHUB = "cosmoshub",
  OSMOSIS = "osmosis",
  COSMOSHUB_TESTNET = "cosmoshub-testnet",
}

type Unit = {
  name: string;
  code: string;
  decimals: number;
};

type ChainParams = CosmosParams; // Intended as union of all existing chain-specific params: AlgorandParams | CosmosParams | ...

type Chain = {
  id: ChainId;
  name: string;
  family: string;
  units: Unit[];
  backends: Backends;
  params?: ChainParams;
};

type Backends = {
  nodeURL: string;
  explorerURL?: string;
};

type AddressState = {
  balances: {
    available: bigint;
    //locked: bigint;
    //unlocking: bigint[];
    //unlocked: bigint;
  };
};
// FIXME Can't be validated at runtime!
type TransactionMode = "transfer" | "optIn" | "claimReward" | "delegate" | "undelegate" | "redelegate";

// TODO WIP
// FIXME de/serialization types <> string
// FIXME ambiguity for completed fields (amount, fees...) : required or not?
// FIXME one 'PlainTransaction' type with everything in it, or composition of specific types
// (TransactionWithMemo TransactionWithGas, etc...) ?
type CommonTransaction = {
  chainId: ChainId;
  senders: string[];
  recipients: string[];
  amount: bigint;
  useMaxAmount?: boolean;
  fees: bigint;
  gas?: bigint;
  nonce?: bigint;
  memo?: string;
  format?: Format; // FIXME should not be here
  pubKey?: string; // FIXME should not be here
};

type TransferTransaction = CommonTransaction & {
  mode: "transfer";
};

type DelegateTransaction = CommonTransaction & {
  mode: "delegate";
  validator: string;
};

type UndelegateTransaction = CommonTransaction & {
  mode: "undelegate";
  validator: string;
};

type RedelegateTransaction = CommonTransaction & {
  mode: "redelegate";
  sourceValidator: string;
  targetValidator: string;
};

type ClaimRewardTransaction = CommonTransaction & {
  mode: "claimReward";
  validator: string;
};

type PlainTransaction =
  | TransferTransaction
  | DelegateTransaction
  | UndelegateTransaction
  | RedelegateTransaction
  | ClaimRewardTransaction;

type Transaction = {
  //metadata: TransactionMetadata // good idea or not ?
  plain: PlainTransaction;
  encoded?: string;
  signature?: string;
  status?: TransactionStatus;
};

/*
type TransactionMetadata = {
  chain: ChainId;
  useMaxAmount: boolean;
};
*/

type TransactionStatus = {
  errors: ErrorMsg[];
  warnings: ErrorMsg[];
};

type BroadcastStatus = {
  error?: ErrorMsg;
  hash?: string;
};

type ErrorCode = "OK" | "KO";

// TODO Return code, message should be on client side?
type ErrorMsg = {
  //code: ErrorCode;
  message: string;
};

export type Format = "json" | "hex";

// TODO Doc for each function
interface ChainService<V = any> {
  // Chain
  //getChainParams(chainId: ChainId): Promise<ChainParams>; // For dynamic params?

  // Address
  pubkeyToAddress(chainId: ChainId, pubkey: string): Promise<string>;
  validateAddress(chainId: ChainId, address: string): Promise<boolean>;

  // Data
  getAddressState(chainId: ChainId, address: string): Promise<AddressState>;
  //getAddressHistory(chainId: ChainId, address: string): Promise<AddressHistory>;
  getValidators?(chainId: ChainId, offset: number, limit: number): Promise<ValidatorResponse<V>>;

  // Crafting
  validateTransactionIntent(chainId: ChainId, transaction: PlainTransaction): Promise<TransactionStatus>;
  completeTransaction(chainId: ChainId, transaction: PlainTransaction): Promise<PlainTransaction>;
  validateTransaction(chainId: ChainId, transaction: PlainTransaction): Promise<TransactionStatus>;
  encodeTransactionToSign(chainId: ChainId, transaction: PlainTransaction, format?: Format): Promise<string>;
  encodeTransactionToBroadcast(chainId: ChainId, signedTransaction: Transaction): Promise<string>;
  broadcastTransaction(chainId: ChainId, signedTransaction: string): Promise<BroadcastStatus>;
}

export { ChainId };
export type {
  Chain,
  ChainParams,
  AddressState,
  TransactionMode,
  PlainTransaction,
  Transaction,
  TransactionStatus,
  BroadcastStatus,
  ErrorMsg,
  ChainService,
};
