import { BitcoinChainParams, BitcoinTransactionParams } from "../families/bitcoin/types";
import { CosmosChainParams, CosmosTransactionParams } from "../families/cosmos/types";
import { EvmChainParams } from "../families/evm/types";

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
  GNOSIS = "gnosis",
  GNOSIS_CHIADO = "gnosis-chiado",
  MOONBEAM = "moonbeam",
  MOONRIVER = "moonriver",
  MOONBASE = "moonbase",
  FANTOM = "fantom",
  PALM = "palm",
  MANTLE = "mantle",
  // BTC family
  BITCOIN = "bitcoin",
  BITCOIN_TESTNET = "bitcoin-testnet",
}

enum ChainFamily {
  ALGORAND = "algorand",
  COSMOS = "cosmos",
  EVM = "evm",
  BITCOIN = "bitcoin",
}

type ChainParams = CosmosChainParams | EvmChainParams | BitcoinChainParams;

enum ChainFeature {
  BALANCES_NATIVE = "balances.native",
  BALANCES_TOKENS = "balances.tokens",
  //BALANCES_NFT = "balances.nft",
  BALANCES_STAKING = "balances.staking",
  TRANSACTIONS_NATIVE = "transactions.native",
  TRANSACTIONS_TOKENS = "transactions.tokens",
  //TRANSACTIONS_NFT = "transactions.nft",
  TRANSACTIONS_STAKING = "transactions.staking",
  MEMO = "memo",
}

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
  supportedFeatures: ChainFeature[];
};

// Or? : evm.ethereum.fungible | evm.ethereum.nft | algorand.algorand.native | algorand.algorand.fungible | cosmos.injective.native ...
enum TokenType {
  ASA = "ASA",
  ERC20 = "ERC20",
  IBC = "IBC",
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

type CommonState = {
  chainId: ChainId;
  balances: {
    native: {
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

type AccountState = CommonState & {
  accountId: string;
};

type AddressesAggregatedState = CommonState & {
  addresses: string[];
};

enum TransactionMode {
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
  DELEGATE = "delegate",
  REDELEGATE = "redelegate",
  UNDELEGATE = "undelegate",
  CLAIM_REWARDS = "claimRewards",
}

type TransactionParams = CosmosTransactionParams | BitcoinTransactionParams;

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
  offset: number;
  limit: number;
};

export {
  ChainFamily,
  ChainFeature,
  ChainId,
  EncodedTransactionFormat,
  StakingStatus,
  TokenType,
  TransactionMode,
};

export type {
  AccountState,
  AddressesAggregatedState,
  BroadcastStatus,
  Chain,
  ChainParams,
  ErrorMsg,
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
  Validator,
};
