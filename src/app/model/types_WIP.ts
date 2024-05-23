import { CosmosParams } from "../families/cosmos/types";
import { EvmParams } from "../families/evm/types";

enum ChainId {
  ALGORAND = "algorand",
  COSMOSHUB = "cosmoshub",
  OSMOSIS = "osmosis",
  COSMOSHUB_TESTNET = "cosmoshub-testnet",
  ETHEREUM = "ethereum",
  SEPOLIA = "sepolia",
  HOLESKY = "holesky",
  ZKSYNC = "zksync",
  ZKSYNC_SEPOLIA = "zksync-sepolia",
  INJECTIVE_TESTNET = "injective-testnet",
  BASE = "base",
  BASE_SEPOLIA = "base-sepolia",
  OPTIMISM = "optimism",
  OPTIMISM_SEPOLIA = "optimism-sepolia",
  ARBITRUM = "arbitrum",
  ARBITRUM_SEPOLIA = "arbitrum-sepolia",
}

type Unit = {
  id: string;
  tag: string;
  decimals: number;
};

type Amount = {
  unit: Unit;
  value: bigint;
};

type ChainParams = CosmosParams | EvmParams; // Intended as union of all existing chain-specific params: AlgorandParams | CosmosParams | ...

// FIXME Can TParams be replaced with ChainParams?
type Chain<TParams> = {
  id: ChainId;
  //nativeId: string; // e.g value of chain-id on EVM
  name: string;
  family: string;
  unit: Unit;
  backends: Backends;
  params?: TParams;
};

type TokenType = "ERC20" | "ASA";
// Or? : evm.ethereum.fungible | evm.ethereum.nft | algorand.algorand.native | algorand.algorand.fungible | cosmos.injective.native ...

// Unused/unneeded at the moment
type Token = {
  chainId: ChainId;
  type: TokenType;
  id: string; // <ChainID>/<type>/<nativeId>
  nativeId: string; // e.g contract address on EVM
  name: string;
  unit: Unit;
  contractAddress?: string;
};

type Backends = {
  nodeURL: string;
  explorerURL?: string;
};

type AddressState = {
  chainId: ChainId;
  balances: {
    native: {
      available: Amount; // Cosmos, Polkadot, Solana : provides available, need to deduce total from staking
      //total: ChainAmount; // Will need staking
    };
    tokens?: Amount[];
  };
  //rewards?: {
  //  pending: ChainAmount;
  //};
  //staking?: {
  //locked: bigint;
  //unlocking: bigint[];
  //unlocked: bigint;
  //}
};

enum TransactionMode {
  TRANSFER = "transfer",
  DELEGATE = "delegate",
  REDELEGATE = "redelegate",
  UNDELEGATE = "undelegate",
  CLAIM_REWARD = "claimReward",
}

// TODO WIP
// FIXME de/serialization types <> string
// FIXME ambiguity for completed fields (amount, fees...) : required or not?
// FIXME one 'PlainTransaction' type with everything in it, or composition of specific types
// (TransactionWithMemo TransactionWithGas, etc...) ?
type CommonTransaction = {
  mode: TransactionMode;
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
  mode: TransactionMode.TRANSFER;
};

type DelegateTransaction = CommonTransaction & {
  mode: TransactionMode.DELEGATE;
  validator: string;
};

type UndelegateTransaction = CommonTransaction & {
  mode: TransactionMode.UNDELEGATE;
  validator: string;
};

type RedelegateTransaction = CommonTransaction & {
  mode: TransactionMode.REDELEGATE;
  sourceValidator: string;
  targetValidator: string;
};

type ClaimRewardTransaction = CommonTransaction & {
  mode: TransactionMode.CLAIM_REWARD;
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

export { ChainId, TransactionMode };
export type {
  Unit,
  Amount,
  Chain,
  ChainParams,
  Token,
  AddressState,
  PlainTransaction,
  Transaction,
  TransactionStatus,
  BroadcastStatus,
  ErrorMsg,
};
