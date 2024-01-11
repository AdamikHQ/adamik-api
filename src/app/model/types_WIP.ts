// FIXME Can't be validated at runtime!
//type ChainId = "algorand";
enum ChainId {
  ALGORAND = "algorand",
  COSMOS = "cosmos",
}

type AddressState = {
  balances: {
    available: bigint;
    //locked: bigint;
    //unlocking: bigint[];
    //unlocked: bigint;
  };
};
// FIXME Can't be validated at runtime!
type TransactionMode = "transfer" | "optIn" | "claimReward";

// TODO WIP
// FIXME de/serialization types <> string
// FIXME ambiguity for completed fields (amount, fees...) : required or not?
type PlainTransaction = {
  chain: ChainId; // chainId ?
  mode: TransactionMode;
  senders: string[];
  recipients: string[];
  amount: bigint;
  useMaxAmount?: boolean;
  fees: bigint;
  nonce?: bigint;
  memo?: string;
};

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

// TODO Doc for each function
interface ChainService {
  // Address
  pubkeyToAddress(pubkey: string): Promise<string>;
  validateAddress(address: string): Promise<boolean>;

  // Data
  getAddressState(address: string): Promise<AddressState>;
  //getAddressHistory(address: string): Promise<AddressHistory>;

  // Crafting
  validateTransactionIntent(transaction: PlainTransaction): Promise<TransactionStatus>;
  completeTransaction(transaction: PlainTransaction): Promise<PlainTransaction>;
  validateTransaction(transaction: PlainTransaction): Promise<TransactionStatus>;
  encodeTransactionToSign(transaction: PlainTransaction): Promise<string>;
  encodeTransactionToBroadcast(signedTransaction: Transaction): Promise<string>;
  broadcastTransaction(signedTransaction: string): Promise<BroadcastStatus>;
}

export { ChainId };
export type {
  AddressState,
  TransactionMode,
  PlainTransaction,
  Transaction,
  TransactionStatus,
  BroadcastStatus,
  ErrorMsg,
  ChainService,
};
