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
  POLYGON = "polygon",
  POLYGON_AMOY = "polygon-amoy",
  BSC = "bsc",
  BSC_TESTNET = "bsc-testnet",
  LINEA = "linea",
  LINEA_SEPOLIA = "linea-sepolia",
  AVALANCHE = "avalanche",
  GNOSIS = "gnosis",
  GNOSIS_CHIADO = "gnosis-chiado",
}

enum ChainFamily {
  ALGORAND = "algorand",
  COSMOS = "cosmos",
  EVM = "evm",
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
  family: ChainFamily;
  ticker: string;
  decimals: number;
  backends: Backends;
  isTestNet?: boolean;
  params?: TParams;
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
  format?: EncodedTransactionFormat; // FIXME should not be here
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

export { ChainId, ChainFamily, TransactionMode, EncodedTransactionFormat, TokenType, StakingStatus };
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
  PlainTransaction,
  Transaction,
  TransactionSpendableAmounts,
  TransactionStatus,
  BroadcastStatus,
  ErrorMsg,
  Pagination,
};
