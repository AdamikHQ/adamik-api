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
}

enum ChainFamily {
  ALGORAND = "algorand",
  COSMOS = "cosmos",
  EVM = "evm",
}

type ChainParams = CosmosChainParams | EvmChainParams;

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
  tokenId: string;
};

type AddressState = {
  chainId: ChainId;
  address: string;
  balances: {
    native: {
      available: bigint; // Cosmos, Polkadot, Solana : all provide available, so need to deduce total from staking
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

enum TransactionMode {
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
  DELEGATE = "delegate",
}

type TransactionParams = CosmosTransactionParams;

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
  format?: EncodedTransactionFormat;
  params?: TransactionParams;
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

// type UndelegateTransaction = CommonTransaction & {
//   mode: TransactionMode.UNDELEGATE;
//   validatorAddress: string;
// };

// type RedelegateTransaction = CommonTransaction & {
//   mode: TransactionMode.REDELEGATE;
//   sourceValidatorAddress: string;
//   targetValidatorAddress: string;
// };

// type ClaimRewardTransaction = CommonTransaction & {
//   mode: TransactionMode.CLAIM_REWARD;
//   validatorAddress: string;
// };

type PlainTransaction = TransferTransaction | TransferTokenTransaction | DelegateTransaction;

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

type BroadcastStatus = { hash: string } | { error: ErrorMsg };

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
  ChainId,
  ChainFamily,
  ChainFeature,
  TransactionMode,
  EncodedTransactionFormat,
  TokenType,
  StakingStatus,
};
export type {
  Chain,
  ChainParams,
  Token,
  TokenAmount,
  Validator,
  StakingPosition,
  StakingReward,
  TokenStakingReward,
  AddressState,
  TransactionParams,
  PlainTransaction,
  Transaction,
  TransactionSpendableAmounts,
  TransactionStatus,
  BroadcastStatus,
  ErrorMsg,
  Pagination,
};
