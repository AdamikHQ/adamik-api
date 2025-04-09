import { CosmosChainParams } from "~/app/families/cosmos/types";
import { EvmChainParams } from "~/app/families/evm/types";
import { BitcoinChainParams, BitcoinTransactionParams } from "../families/bitcoin/types";
import { StarknetTransactionParams } from "../families/starknet/types";
import { TonTransactionParams } from "../families/ton/types";
import { TronTransactionParams } from "../families/tron/types";

enum ChainId {
  ALGORAND = "algorand",
  ETHEREUM = "ethereum",
  SEPOLIA = "sepolia",
  HOLESKY = "holesky",
  ZKSYNC = "zksync",
  ZKSYNC_SEPOLIA = "zksync-sepolia",
  INJECTIVE_EVM_TESTNET = "injective-evm-testnet",
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
  TRON = "tron",
  ROOTSTOCK = "rootstock",
  ROOTSTOCK_TESTNET = "rootstock-testnet", //TODO, fix view error on write API (EIP=1559 not supported)
  BITCOIN = "bitcoin",
  BITCOIN_TESTNET = "bitcoin-testnet",
  BITCOIN_SIGNET = "bitcoin-signet",
  LITECOIN = "litecoin",
  DOGECOIN = "dogecoin",
  STARKNET = "starknet",
  MONAD_TESTNET = "monad-testnet",
  BITSONG = "bitsong",
  CHIHUAHUA = "chihuahua",
  SEDA = "seda",
  PERSISTENCE = "persistence",
  COMDEX = "comdex",
  HUMANS_AI = "humans-ai",
  KI = "ki",
  MARS_HUB = "mars-hub",
  PROVENANCE = "provenance",
  QUICKSILVER = "quicksilver",
  SAGA = "saga",
  UX_CHAIN = "ux-chain",
  KAVA = "kava",
  SEI = "sei",
  FETCH_AI = "fetch-ai",
  COSMOSHUB = "cosmoshub",
  OSMOSIS = "osmosis",
  CELESTIA = "celestia",
  DYDX = "dydx",
  AXELAR = "axelar",
  EVMOS = "evmos",
  IRISNET = "irisnet",
  JUNO = "juno",
  LUM_NETWORK = "lum-network",
  OMNIFLIX = "omniflix",
  MEDIBLOC = "medibloc",
  PASSAGE = "passage",
  QUASAR = "quasar",
  SOMMELIER = "sommelier",
  SHENTU = "shentu",
  STRIDE = "stride",
  NEUTRON = "neutron",
  TERRA = "terra2",
  AKASH = "akash",
  DYMENSION = "dymension",
  BAND = "band",
  STARGAZE = "stargaze",
  KYVE = "kyve",
  LIKECOIN = "likecoin",
  OSMOSIS_TESTNET = "osmosis-testnet", //using lavanet
  CELESTIA_TESTNET = "celestia-testnet", //using lavanet
  COSMOSHUB_TESTNET = "cosmoshub-testnet", //using nodestake
  INJECTIVE = "injective", //using mintscan node
  //BABYLON = "babylon",
  BABYLON_TESTNET = "babylon-testnet",

  //Their own family
  // EGLD = "egld",
  // SOL = "sol",
  // NEAR = "near",
  // ALEPH = "aleph",

  BERACHAIN = "berachain",
  BERACHAIN_ARTIO = "berachain-artio",
  CRONOS = "cronos",
  WORLD_CHAIN = "world-chain",
}

enum ChainFamily {
  ALGORAND = "algorand",
  COSMOS = "cosmos",
  EVM = "evm",
  BITCOIN = "bitcoin",
  TRON = "tron",
  TON = "ton",
  STARKNET = "starknet",
}

type ChainParams = CosmosChainParams | EvmChainParams | BitcoinChainParams;

type FeaturesSet = {
  native: boolean;
  tokens: boolean;
  staking: boolean;
};

type ChainSupportedFeatures = {
  read: {
    token: boolean;
    validators: boolean;
    transaction: FeaturesSet;
    account: {
      balances: FeaturesSet;
      transactions: FeaturesSet;
    };
  };
  write: {
    transaction: {
      type: { [key in TransactionMode]: boolean };
      field: {
        memo: boolean;
      };
    };
  };
  utils: {
    addresses: boolean;
  };
};

// Define filters as flags: anything put in the object is true to flag that the filter is "ON"
type ApiRequestFilters = Record<string, true>;

export enum ProviderType {
  node = "node",
  blockchair = "blockchair",
  mintscan = "mintscan",
  blockscout = "blockscout",
  routescan = "routescan",
  etherscan = "etherscan",
  alchemy = "alchemy",
  moralis = "moralis",
  tonapi = "tonapi",
  tronscan = "tronscan",
  starkscan = "starkscan",
  algoindexer = "algoindexer",
  mempoolspace = "mempoolspace",
  oklink = "oklink",
}

type Provider = {
  url: string;
  type: ProviderType;
};

enum Curve {
  SECP256K1 = "secp256k1",
  ED25519 = "ed25519",
  STARK = "stark",
}

enum HashFunction {
  SHA256 = "sha256",
  KECCAK256 = "keccak256",
  SHA512_256 = "sha512_256",
  PEDERSEN = "pedersen",
}

enum SignatureFormat {
  RSV = "rsv",
  RS = "rs",
}

type SignerSpec = {
  curve: Curve;
  hashFunction: HashFunction;
  signatureFormat: SignatureFormat;
  coinType: string;
};

type Chain = {
  family: ChainFamily;
  id: ChainId;
  nativeId: string; // Native chain identifier as defined by the chain itself
  name: string;
  ticker: string;
  decimals: number;
  providers: Provider[];
  isTestnetFor?: string; // Should be a 'ChainId', but it would prevent to support testnets for which we don't support the mainnet
  params?: ChainParams;
  supportedFeatures: ChainSupportedFeatures;
  signerSpec: SignerSpec;
};

// Or? : evm.ethereum.fungible | evm.ethereum.nft | algorand.algorand.native | algorand.algorand.fungible | cosmos.injective.native ...
enum TokenType {
  TRC10 = "TRC10",
  TRC20 = "TRC20",
  ASA = "ASA",
  ERC20 = "ERC20",
  IBC = "IBC",
  JETTON = "JETTON",
}

type Token = {
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

type Validator = {
  address: string;
  name: string;
  commission?: number;
  stakedAmount?: bigint;
};

type ChainValidators = {
  validators: Validator[];
};

enum StakingStatus {
  FREE = "free", // Can be used as part of the available balance
  LOCKED = "locked",
  UNLOCKING = "unlocking",
  UNLOCKED = "unlocked", // Can't be used as part of the avaialble balance, needs a transaction first
}

type StakingPosition = {
  stakeId?: string; // Babylon use-case: need to associate a staking position to its transaction hash
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

type AccountTokens = {
  tokens: TokenAmount[];
};

type AccountHistory = {
  transactions: FinalizedTransaction[];
};

type TypedAddress = {
  type: string;
  address: string;
};

enum TransactionMode {
  DEPLOY_ACCOUNT = "deployAccount",
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
  STAKE = "stake",
  UNSTAKE = "unstake",
  CLAIM_REWARDS = "claimRewards",
  WITHDRAW = "withdraw",
  REGISTER_STAKE = "registerStake", // Babylon use-case: register a bitcoin stake
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
    id: string;
    mode: TransactionMode | "unknown";
    tokenId?: string;
    state: TransactionState;
    blockHeight?: bigint;
    timestamp?: number;
    fees: {
      amount: bigint;
      ticker?: string;
    };
    gas?: bigint;
    nonce?: bigint;
    memo?: string;
    senders?: {
      address: string;
      amount: bigint;
      ticker?: string;
    }[];
    recipients?: {
      address: string;
      amount: bigint;
      ticker?: string;
    }[];
    validators?: {
      source?: {
        address: string;
        amount: bigint;
        ticker?: string;
      };
      target?: {
        address: string;
        amount: bigint;
        ticker?: string;
      };
    };
  };
  raw?: unknown; // The raw transaction as returned from the provider
  //params?: FinalizedTransactionParams; // NOTE Probably a bad idea, difficult for the client to know what to parse in here
};

type TransactionParams =
  | BitcoinTransactionParams
  | TronTransactionParams
  | StarknetTransactionParams
  | TonTransactionParams;

enum DeployContractType {
  ARGENTX = "argentx",
}

// TODO WIP
// FIXME ambiguity for completed fields (amount, fees...) : required or not?
// FIXME one 'TransactionData' type with everything in it, or composition of specific types
// (TransactionWithMemo TransactionWithGas, etc...) ?
type CommonTransactionData = {
  mode: TransactionMode;
  senderAddress: string;
  senderPubKey?: string;
  recipientAddress: string;
  amount?: bigint;
  useMaxAmount?: boolean;
  fees?: bigint;
  gas?: bigint;
  nonce?: bigint;
  memo?: string;
  params?: TransactionParams;
};

type DeployAccountTransactionData = CommonTransactionData & {
  mode: TransactionMode.DEPLOY_ACCOUNT;
  senderPubKey: string; // Not optional for deploy account transactions
  contractType: DeployContractType;
};

type TransferTransactionData = CommonTransactionData & {
  mode: TransactionMode.TRANSFER;
};

// FIXME Should this be merged with TransferTransactionData, just adding optional 'tokenId' to it?
type TransferTokenTransactionData = CommonTransactionData & {
  mode: TransactionMode.TRANSFER_TOKEN;
  tokenId: string;
};

type StakeTransactionData = CommonTransactionData & {
  mode: TransactionMode.STAKE;
  sourceValidatorAddress?: string; // cosmos "redelegate" use-case, if provided
  targetValidatorAddress: string;
};

type UnstakeTransactionData = CommonTransactionData & {
  mode: TransactionMode.UNSTAKE;
  validatorAddress: string;
  stakeId?: string;
};

type ClaimRewardsTransactionData = CommonTransactionData & {
  mode: TransactionMode.CLAIM_REWARDS;
  validatorAddress: string;
  compound?: boolean;
  stakeId?: string;
};

// NOTE Specific to babylon + bitcoin at the moment,
// no need to make it more generic until there's another use-case
type WithdrawTransactionData = CommonTransactionData & {
  mode: TransactionMode.WITHDRAW;
  senderPubKey: string; // Not optional for withdraw transactions
  validatorAddress: string;
  stakeId: string;
};

// NOTE Very specific to babylon + bitcoin at the moment,
// no need to make it more generic until there's another use-case (if ever)
type RegisterStakeTransactionData = CommonTransactionData & {
  mode: TransactionMode.REGISTER_STAKE;
  amount: bigint; // Not optional for register transactions
  senderPubKey: string; // Not optional for register transactions
  proofOfPossession: string;
  validatorPubKey: string;
  unsignedUnbondingTransaction: string;
  signedStakingTransaction: string;
  signedSlashingTransaction: string;
  signedUnbondingSlashingTransaction: string;
};

type TransactionData =
  | DeployAccountTransactionData
  | TransferTransactionData
  | TransferTokenTransactionData
  | StakeTransactionData
  | UnstakeTransactionData
  | ClaimRewardsTransactionData
  | WithdrawTransactionData
  | RegisterStakeTransactionData;

type EncodedTransaction = {
  format: EncodedTransactionFormat;
  value: string;
};

enum EncodedTransactionFormat {
  HASH_KECCAK256 = "HASH_KECCAK256",
  HASH_SHA256 = "HASH_SHA256",
  HASH_SHA512_256 = "HASH_SHA512_256",
  HASH_PEDERSEN = "HASH_PEDERSEN",
  RLP = "RLP",
  WALLET_CONNECT = "WALLET_CONNECT",
  SIGNDOC_DIRECT = "SIGNDOC_DIRECT",
  SIGNDOC_DIRECT_JSON = "SIGNDOC_DIRECT_JSON",
  SIGNDOC_AMINO = "SIGNDOC_AMINO",
  SIGNDOC_AMINO_JSON = "SIGNDOC_AMINO_JSON",
  BOC = "BOC",
  RAW_TRANSACTION = "RAW_TRANSACTION",
  MSGPACK = "MSGPACK",
  PSBT = "PSBT",
}

type Transaction = {
  data: TransactionData;
  encoded?: EncodedTransaction[];
  signature?: string;
};

// Used to list spendable amounts, in native currency and one optional token currency
type TransactionSpendableAmounts = {
  native: bigint;
  token?: bigint;
};

type Paginated<T> = T & {
  pagination: {
    nextPage: string | null;
  };
};

type ErrorCode = "OK" | "KO";

// TODO Use code, and message should be on client side?
type ErrorMsg = {
  //code: ErrorCode;
  message: string;
};

type Status = {
  errors: ErrorMsg[];
  warnings: ErrorMsg[];
};

export {
  ChainFamily,
  ChainId,
  Curve,
  DeployContractType,
  EncodedTransactionFormat,
  HashFunction,
  SignatureFormat,
  StakingStatus,
  TokenType,
  TransactionMode,
  TransactionState,
};

export type {
  AccountHistory,
  AccountState,
  AccountTokens,
  ApiRequestFilters,
  Chain,
  ChainParams,
  ChainSupportedFeatures,
  ChainValidators,
  EncodedTransaction,
  FeaturesSet,
  FinalizedTransaction,
  Paginated,
  Provider,
  RegisterStakeTransactionData,
  SignerSpec,
  StakingPosition,
  StakingReward,
  Status,
  Token,
  TokenAmount,
  TokenStakingReward,
  Transaction,
  TransactionData,
  TransactionSpendableAmounts,
  TypedAddress,
  Validator,
};
