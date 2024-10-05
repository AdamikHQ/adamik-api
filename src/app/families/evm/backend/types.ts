import { EvmAddress } from "../types";

type EtherscanERC20Event = {
  contractAddress: EvmAddress;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  // blockNumber: string;
  // timeStamp: string;
  // hash: string;
  // nonce: string;
  // blockHash: string;
  // from: EvmAddress;
  // to: EvmAddress;
  // value: string;
  // transactionIndex: string;
  // gas: string;
  // gasPrice: string;
  // gasUsed: string;
  // cumulativeGasUsed: string;
  // input: string;
  // confirmations: string;
};

// NOTE Unused at the moment
/*
type MoralisDecodedTransaction = {
  hash: string;
  nonce: bigint;
  from_address: string;
  to_address: string;
  value: string;
  transaction_fee: string;
  gas: string;
  gas_price: string;
  input: string;
  receipt_gas_used: string;
  receipt_contract_address: string;
  block_timestamp: string;
  block_number: string;
  decoded_call: {
    type: string;
    label: string;
    signature: string;
    params: {
      name: string;
      type: string;
      value: string;
      params: [];
    }[];
  };
};
*/

type MoralisERC20Token = {
  address: EvmAddress;
  //address_label: null,
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  possible_spam: boolean;
  //logo_hash: null,
  //thumbnail: "https://logo.moralis.io/0x2105_0x532f27101965dd16442e59d40670faf5ebb142e4_8c9af70df8294a468a3670c70cd874f4",
  //total_supply: "9999997629777789098867514201",
  //total_supply_formatted: "9999997629.777789098867514201",
  //fully_diluted_valuation: "1457002353.04",
  //block_number: "16478666",
  //validated: 1,
  //created_at: "2024-02-24T06:47:51.000Z",
};

type MoralisERC20TokenBalance = {
  token_address: EvmAddress;
  name: string;
  symbol: string;
  //logo: string,
  //thumbnail: string,
  decimals: number;
  native_token: boolean;
  possible_spam: boolean;
  balance: string;
  //verified_contract: boolean;
  //balance_formatted: string;
  //total_supply: string;
  //total_supply_formatted: string;
  //usd_price: number;
  //usd_price_24hr_percent_change: number;
  //usd_price_24hr_usd_change: number;
  //usd_value: number;
  //usd_value_24hr_usd_change: number;
  //portfolio_percentage: number;
};

type MoralisWalletTransactionsResponse = {
  page: string;
  page_size: string;
  cursor: string;
  result: MoralisWalletTransaction[];
};

type MoralisWalletTransaction = {
  hash: string;
  nonce: string;
  transaction_index: string;
  from_address_entity: string;
  from_address_entity_logo: string;
  from_address: string;
  from_address_label: string;
  to_address_entity: string;
  to_address_entity_logo: string;
  to_address: string;
  to_address_label: string;
  value: string;
  gas: string;
  gas_price: string;
  transaction_fee: string;
  receipt_cumulative_gas_used: string;
  receipt_gas_used: string;
  receipt_contract_address: string;
  receipt_root: string;
  receipt_status: string;
  block_timestamp: Date;
  block_number: string;
  block_hash: string;
  internal_transactions: MoralisInternalTransaction[];
  nft_transfers: MoralisNftTransfer[];
  erc20_transfers: MoralisErc20Transfer[];
  native_transfers: MoralisNativeTransfer[];
};

type MoralisNativeTransfer = {
  from_address_entity: string;
  from_address_entity_logo: string;
  from_address: string;
  from_address_label: string;
  to_address_entity: string;
  to_address_entity_logo: string;
  to_address: string;
  to_address_label: string;
  value: string;
  value_formatted: string;
  direction: string;
  internal_transaction: string;
  token_symbol: string;
  token_logo: string;
};

type MoralisErc20Transfer = {
  token_name: string;
  token_symbol: string;
  token_logo: string;
  token_decimals: string;
  transaction_hash: string;
  address: string;
  block_timestamp: Date;
  block_number: string;
  block_hash: string;
  to_address_entity: string;
  to_address_entity_logo: string;
  to_address: string;
  to_address_label: string;
  from_address_entity: string;
  from_address_entity_logo: string;
  from_address: string;
  from_address_label: string;
  value: string;
  transaction_index: number;
  log_index: number;
  possible_spam: string;
  verified_contract: string;
};

type MoralisNftTransfer = {
  token_address: string;
  token_id: string;
  from_address_entity: string;
  from_address_entity_logo: string;
  from_address: string;
  from_address_label: string;
  to_address_entity: string;
  to_address_entity_logo: string;
  to_address: string;
  to_address_label: string;
  value: string;
  amount: string;
  contract_type: string;
  block_number: string;
  block_timestamp: Date;
  block_hash: string;
  transaction_hash: string;
  transaction_type: string;
  transaction_index: number;
  log_index: number;
  operator: string;
  possible_spam: string;
  verified_collection: string;
};

type MoralisInternalTransaction = {
  transaction_hash: string;
  block_number: string;
  block_hash: string;
  type: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gas_used: string;
  input: string;
  output: string;
};

export type {
  EtherscanERC20Event,
  MoralisERC20Token,
  MoralisERC20TokenBalance,
  MoralisWalletTransaction,
  MoralisWalletTransactionsResponse,
};
