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

type ChainParams = CosmosParams | EvmParams; // Intended as union of all existing chain-specific params: AlgorandParams | CosmosParams | ...

type Backends = {
  nodeURL: string;
  explorerURL?: string;
};

// FIXME Can TParams be replaced with ChainParams?
type Chain<TParams> = {
  id: ChainId;
  //nativeId: string; // e.g value of chain-id on EVM
  name: string;
  family: string;
  ticker: string;
  decimals: number;
  backends: Backends;
  params?: TParams;
};

// Or? : evm.ethereum.fungible | evm.ethereum.nft | algorand.algorand.native | algorand.algorand.fungible | cosmos.injective.native ...
enum TokenType {
  ASA = "ASA",
  ERC20 = "ERC20",
}

type Token = {
  chainId: ChainId;
  type: TokenType;
  id: string;
  name: string;
  ticker: string;
  decimals: number;
  contractAddress?: string;
};

type TokenAmount = {
  token: Token;
  value: bigint;
};

type AddressState = {
  chainId: ChainId;
  address: string;
  balances: {
    native: {
      available: bigint; // Cosmos, Polkadot, Solana : all provide available, need to deduce total from staking
      //total: bigint; // Will need staking
    };
    tokens?: TokenAmount[];
    //ft?: TokenAmount[];
    //nft?: NFTAmount[];
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
  TRANSFER_TOKEN = "transferToken",
  DELEGATE = "delegate",
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
  nonce?: number;
  memo?: string;
  format?: Format; // FIXME should not be here
  pubKey?: string; // FIXME should not be here
};

type TransferTransaction = CommonTransaction & {
  mode: TransactionMode.TRANSFER;
};

type TransferTokenTransaction = CommonTransaction & {
  mode: TransactionMode.TRANSFER_TOKEN;
  tokenId: string;
};

type DelegateTransaction = CommonTransaction & {
  mode: TransactionMode.DELEGATE;
  validator: string;
};

// type UndelegateTransaction = CommonTransaction & {
//   mode: TransactionMode.UNDELEGATE;
//   validator: string;
// };

// type RedelegateTransaction = CommonTransaction & {
//   mode: TransactionMode.REDELEGATE;
//   sourceValidator: string;
//   targetValidator: string;
// };

// type ClaimRewardTransaction = CommonTransaction & {
//   mode: TransactionMode.CLAIM_REWARD;
//   validator: string;
// };

type PlainTransaction = TransferTransaction | TransferTokenTransaction;

type Transaction = {
  //metadata: TransactionMetadata // good idea or not ?
  plain: PlainTransaction;
  encoded?: string;
  signature?: string;
  status: TransactionStatus;
};

/*
type TransactionMetadata = {
  chain: ChainId;
  useMaxAmount: boolean;
};
*/

// Used to list spendable amounts, in native currency and one optional token currency
type TransactionSpendableAmounts = {
  native: bigint;
  token?: bigint;
};

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

export { ChainId, TransactionMode, TokenType };
export type {
  Chain,
  ChainParams,
  Token,
  TokenAmount,
  AddressState,
  PlainTransaction,
  Transaction,
  TransactionSpendableAmounts,
  TransactionStatus,
  BroadcastStatus,
  ErrorMsg,
};
