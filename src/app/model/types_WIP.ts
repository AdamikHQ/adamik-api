import { z } from "zod";
import { BtcParams } from "../families/bitcoin/types";
import { CosmosParams } from "../families/cosmos/types";
import { EvmParams } from "../families/evm/types";
import { requestSchema as addressStateRequestSchema } from "../api/address/state/schema";

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
  BITCOIN = "bitcoin",
  BITCOIN_TESTNET = "bitcoin-testnet",
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
  BTC = "bitcoin",
}

type ChainParams = CosmosParams | EvmParams | BtcParams; // Intended as union of all existing chain-specific params: AlgorandParams | CosmosParams | ...

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
type StateOrigin = z.infer<typeof addressStateRequestSchema>["address"];

type AddressState = {
  chainId: ChainId;
  address: string;
  balances: {
    native: {
      available: bigint; // Cosmos, Polkadot, Solana : all provide available, need to deduce total from staking
      unconfirmed?: bigint; // Bitcoin: available + pending
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

type AddressesState = {
  chainId: ChainId;
  addresses: {
    [key: string]: {
      balances: AddressState["balances"];
    };
  };
};

// FIXME: Should fully replace AddressState?
type AccountState = {
  chainId: ChainId;
  balances: {
    native: {
      available: bigint; // Cosmos, Polkadot, Solana : all provide available, need to deduce total from staking
      unconfirmed?: bigint; // Bitcoin: available + pending
    };
    tokens?: TokenAmount[];
  };
};

enum TransactionMode {
  TRANSFER = "transfer",
  TRANSFER_TOKEN = "transferToken",
  DELEGATE = "delegate",
  TRANSFER_TO_MANY = "transferToMany",
}

type Recipient = {
  amount: bigint;
  address: string;
};

// TODO WIP
// FIXME de/serialization types <> string
// FIXME ambiguity for completed fields (amount, fees...) : required or not?
// FIXME one 'PlainTransaction' type with everything in it, or composition of specific types
// (TransactionWithMemo TransactionWithGas, etc...) ? <-- yes
type BaseTransaction = {
  mode: TransactionMode;
  chainId: ChainId;
}

type CommonTransaction = {
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

type TransferTransaction = BaseTransaction & CommonTransaction & {
  mode: TransactionMode.TRANSFER;
};

type TransferTokenTransaction = BaseTransaction & CommonTransaction & {
  mode: TransactionMode.TRANSFER_TOKEN;
  tokenId: string;
};

type DelegateTransaction = BaseTransaction & CommonTransaction & {
  mode: TransactionMode.DELEGATE;
  validator: string;
};

type MultiRecipientTransaction = BaseTransaction & BaseTransaction & {
  mode: TransactionMode.TRANSFER_TO_MANY;
  senders: string;
  recipients: Recipient[];
  fees: bigint;
}

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


/**
 * @deprecated You should use {@link TransactionData} 
 */
type PlainTransaction = TransferTransaction | TransferTokenTransaction | DelegateTransaction;

type TransactionData = PlainTransaction | MultiRecipientTransaction;

/** 
 * @deprecated You should use {@link TransactionWrapper}
 * 
 * FIXME: refacto EVM + COSMOS + ALGORAND families to stop using Transaction
 */
type Transaction = {
  // plain: PlainTransaction;
  plain: PlainTransaction;
  encoded?: string;
  signature?: string;
  status: TransactionStatus;
};

type TransactionWrapper = {
  plain: TransactionData;
  encoded?: string;
  signature?: string;
  status: TransactionStatus;

}

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

export { ChainId, ChainFamily, TransactionMode, EncodedTransactionFormat, TokenType };
export type {
  Chain,
  ChainParams,
  Token,
  TokenAmount,
  StateOrigin,
  AddressState,
  AddressesState,
  PlainTransaction,
  TransactionData,
  Transaction,
  TransactionWrapper,
  TransactionSpendableAmounts,
  TransactionStatus,
  BroadcastStatus,
  ErrorMsg,
};
