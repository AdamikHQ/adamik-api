import { BitcoinChainParams, BitcoinTransactionParams } from "../families/bitcoin/types";
import { CosmosChainParams, CosmosTransactionParams } from "../families/cosmos/types";
import { EvmChainParams } from "../families/evm/types";
import { TonTransactionParams } from "../families/ton/types";

enum ChainId {
  ALGORAND = "algorand",
  COSMOSHUB = "cosmoshub",
  OSMOSIS = "osmosis",
  OSMOSIS_TESTNET = "osmosis-testnet",
  CELESTIA = "celestia",
  CELESTIA_TESTNET = "celestia-testnet",
  DYDX = "dydx",
  COSMOSHUB_TESTNET = "cosmoshub-testnet",
  AXELAR = "axelar",
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
  POLYGON = "polygon",
  POLYGON_AMOY = "polygon-amoy",
  BSC = "bsc",
  BSC_TESTNET = "bsc-testnet",
  LINEA = "linea",
  LINEA_SEPOLIA = "linea-sepolia",
  AVALANCHE = "avalanche",
  AVALANCHE_FUJI = "avalanche-fuji",
  GNOSIS = "gnosis",
  GNOSIS_CHIADO = "gnosis-chiado",
  MOONBEAM = "moonbeam",
  MOONRIVER = "moonriver",
  MOONBASE = "moonbase",
  FANTOM = "fantom",
  MANTLE = "mantle",
  CHILIZ = "chiliz",
  CHILIZ_TESTNET = "chiliz-testnet",
  TON = "ton",
  ROOTSTOCK = "rootstock",
  ROOTSTOCK_TESTNET = "rootstock-testnet", //TODO, fix view error on write API (EIP=1559 not supported)
  INJECTIVE = "injective",
  // BTC family
  BITCOIN = "bitcoin",
  BITCOIN_TESTNET = "bitcoin-testnet",
  LITECOIN = "litecoin",
  AKASH = "akash",
  BAND = "band",
  DYMENSION = "dymension",
  KYVE = "kyve",
  NEUTRON = "neutron",
  TERRA = "terra2",
  STARGAZE = "stargaze",
  DOGECOIN = "dogecoin",
}

enum ChainFamily {
  ALGORAND = "algorand",
  COSMOS = "cosmos",
  EVM = "evm",
  BITCOIN = "bitcoin",
  TON = "ton",
}

type ChainParams = CosmosChainParams | EvmChainParams | BitcoinChainParams;

enum ChainFeature {
  READ_ACCOUNT_BALANCES_NATIVE = "read.account.balances.native",
  READ_ACCOUNT_BALANCES_TOKENS = "read.account.balances.tokens",
  //READ_ACCOUNT_BALANCES_NFT = "read.account.balances.nft",
  READ_ACCOUNT_BALANCES_STAKING = "read.account.balances.staking",

  //READ_ACCOUNT_TRANSACTIONS_NATIVE = "read.account.transactions.native",
  //READ_ACCOUNT_TRANSACTIONS_TOKENS = "read.account.transactions.tokens",
  //READ_ACCOUNT_TRANSACTIONS_STAKING = "read.account.transactions.staking",

  READ_TRANSACTION_NATIVE = "read.transaction.native",
  READ_TRANSACTION_TOKENS = "read.transaction.tokens",
  READ_TRANSACTION_STAKING = "read.transaction.staking",

  WRITE_TRANSACTION_TYPE_NATIVE = "write.transaction.type.native",
  WRITE_TRANSACTION_TYPE_TOKENS = "write.transaction.type.tokens",
  WRITE_TRANSACTION_TYPE_STAKING = "write.transaction.type.staking",

  WRITE_TRANSACTION_FIELD_MEMO = "write.transaction.field.memo",
}

// Define filters as flags: anything put in the object is true to flag that the filter is "ON"
type ApiRequestFilters = Record<string, true>;

type Backends = {
  nodeURL: string;
  explorerURL?: string;
};

type Chain = {
  family: ChainFamily;
  id: ChainId;
  nativeId: string; // Native chain identifier as defined by the chain itself
  name: string;
  ticker: string;
  decimals: number;
  backends: Backends;
  isTestNet?: boolean;
  params?: ChainParams;
  supportedFeatures: readonly ChainFeature[];
};

// Or? : evm.ethereum.fungible | evm.ethereum.nft | algorand.algorand.native | algorand.algorand.fungible | cosmos.injective.native ...
enum TokenType {
  ASA = "ASA",
  ERC20 = "ERC20",
  IBC = "IBC",
  JETTON = "JETTON",
}

type Token = {
  chainId: ChainId;
  type: TokenType;
  id: string;
  name: string;
  ticker: string;
  decimals: number;
  contractAddress?: string;
  logo?: string;
};

type TokenAmount = {
  token: Token;
  amount: bigint;
};

enum StakingStatus {
  FREE = "free", // Can be used as part of the available balance
  LOCKED = "locked",
  UNLOCKING = "unlocking",
  UNLOCKED = "unlocked", // Can't be used as part of the avaialble balance, needs a transaction first
}

type Validator = {
  address: string;
  name: string;
  commission?: number;
  stakedAmount?: bigint;
};

type StakingPosition = {
  validatorAddresses: string[];
  amount: bigint;
  status: StakingStatus;
  completionDate?: number;
};

type StakingReward = {
  validatorAddress: string;
  amount: bigint;
  //claimable: boolean; // FIXME Unsure how to handle that info
};

type TokenStakingReward = StakingReward & {
  token: Token;
};

type AccountState = {
  chainId: ChainId;
  accountId: string;
  balances: {
    native?: {
      available: bigint; // Cosmos, Polkadot, Solana : all provide available, need to deduce total from staking
      unconfirmed?: bigint; // available + pending (for chains with long confirmation time)
      total: bigint; // May include staking balances, or be equal to available
    };
    tokens?: TokenAmount[];
    //nft?: NFTAmount[];
    staking?: {
      total: bigint;
      locked: bigint;
      unlocking: bigint;
      unlocked: bigint;
      positions: StakingPosition[];
      rewards: {
        native: StakingReward[];
        tokens: TokenStakingReward[];
      };
    };
  };
};

type AccountHistoryPagination = { fromTimestamp?: number; toTimestamp?: number };

type AccountHistory = {
  chainId: ChainId;
  accountId: string;
  transactions: FinalizedTransaction[];
};

type TypedAddress = {
  type: string;
  address: string;
};

enum TransactionMode {
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
  DELEGATE = "delegate",
  REDELEGATE = "redelegate",
  UNDELEGATE = "undelegate",
  CLAIM_REWARDS = "claimRewards",
}

enum TransactionState {
  PENDING = "pending", // In mempool or equivalent
  UNCONFIRMED = "unconfirmed", // In at least 1 block, but not enough for confirmation
  CONFIRMED = "confirmed", // In enough blocks to be considered confirmed
  FAILED = "failed", // Some chains keep record of failed transactions
  UNKNOWN = "unknown",
}

type FinalizedTransaction = {
  parsed?: {
    chainId: ChainId;
    id: string;
    mode: TransactionMode;
    tokenId?: string;
    state: TransactionState;
    blockHeight?: bigint;
    timestamp?: number;
    senders: {
      address: string;
    }[];
    recipients?: {
      address: string;
      amount: bigint;
    }[];
    validators?: {
      source?: {
        address: string;
      };
      target?: {
        address: string;
        amount: bigint;
      };
    };
    fees: bigint;
    gas?: bigint;
    nonce?: bigint;
    memo?: string;
  };
  raw?: unknown; // The raw transaction as returned from the node (or explorer when necessary)
  //params?: FinalizedTransactionParams; // NOTE Probably a bad idea, difficult for the client to know what to parse in here
};

type TransactionParams = CosmosTransactionParams | BitcoinTransactionParams | TonTransactionParams;

// TODO WIP
// FIXME de/serialization types <> string
// FIXME ambiguity for completed fields (amount, fees...) : required or not?
// FIXME one 'TransactionData' type with everything in it, or composition of specific types
// (TransactionWithMemo TransactionWithGas, etc...) ?
// FIXME Does the 'params' field make sense? It allows chain-specific data into the model...
// - alternative: all data could be flat?
// - alternative: an explicit field for each chain? or family? = 'cosmosParams', 'evmParams', etc
type CommonTransaction = {
  mode: TransactionMode;
  chainId: ChainId;
  sender: string;
  recipient: string;
  useMaxAmount: boolean;
  amount?: bigint;
  fees?: bigint;
  gas?: bigint;
  nonce?: bigint;
  memo?: string;
  format?: EncodedTransactionFormat; // FIXME: really required for all transactions?
  params?: TransactionParams; // FIXME: really required for all transactions?
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
  validatorAddress: string;
};

type UndelegateTransaction = CommonTransaction & {
  mode: TransactionMode.UNDELEGATE;
  validatorAddress: string;
};

type RedelegateTransaction = CommonTransaction & {
  mode: TransactionMode.REDELEGATE;
  sourceValidatorAddress: string;
  targetValidatorAddress: string;
};

type ClaimRewardsTransaction = CommonTransaction & {
  mode: TransactionMode.CLAIM_REWARDS;
  validatorAddress: string;
  compound?: boolean;
};

type TransactionData =
  | TransferTransaction
  | TransferTokenTransaction
  | DelegateTransaction
  | UndelegateTransaction
  | RedelegateTransaction
  | ClaimRewardsTransaction;

type Transaction = {
  data: TransactionData;
  encoded?: string;
  signature?: string;
  status: TransactionStatus;
};

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

enum EncodedTransactionFormat {
  JSON = "json",
  HEX = "hex",
}

type Pagination = {
  offset?: number;
  limit?: number;
};

export {
  ChainFamily,
  ChainFeature,
  ChainId,
  EncodedTransactionFormat,
  StakingStatus,
  TokenType,
  TransactionMode,
  TransactionState,
};

export type {
  AccountHistory,
  AccountHistoryPagination,
  AccountState,
  ApiRequestFilters,
  BroadcastStatus,
  Chain,
  ChainParams,
  ErrorMsg,
  FinalizedTransaction,
  Pagination,
  StakingPosition,
  StakingReward,
  Token,
  TokenAmount,
  TokenStakingReward,
  Transaction,
  TransactionData,
  TransactionSpendableAmounts,
  TransactionStatus,
  TypedAddress,
  Validator,
};
