// FIXME Can't be validated at runtime!
//type ChainId = "algorand";
enum ChainId {
  ALGORAND = "algorand",
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

export { ChainId };
export type {
  AddressState,
  TransactionMode,
  PlainTransaction,
  Transaction,
  TransactionStatus,
  BroadcastStatus,
  ErrorMsg,
};
