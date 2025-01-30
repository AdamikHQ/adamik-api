type TokenBalance = {
  contract_address: string;
  owner_address: string;
  balance: string;
};

type TokenBalancesResponse = {
  next_url: string | null;
  data: TokenBalance[];
};

type TokenContract = {
  contract_address: string;
  name: string;
  symbol: string;
  decimals: string;
};

type AccountCall = {
  block_hash: string;
  block_number: number;
  transaction_hash: string;
  caller_address: string;
  contract_address: string;
  calldata: string[];
  result: string[];
  timestamp: number;
  call_type: string;
  class_hash: string;
  selector: string;
  entry_point_type: string;
};

type TransactionResponse = {
  transaction_hash: string;
  block_hash: string;
  block_number: number;
  transaction_index: number;
  transaction_status: string;
  transaction_finality_status: string;
  transaction_execution_status: string;
  transaction_type: string;
  version: number;
  signature: string[];
  max_fee: string;
  actual_fee: string;
  nonce: string;
  contract_address: string | null;
  entry_point_selector: string | null;
  entry_point_type: string | null;
  calldata: string[];
  class_hash: string | null;
  sender_address: string;
  constructor_calldata: string[] | null;
  contract_address_salt: string | null;
  timestamp: number;
  number_of_events: number;
  revert_error: string | null;
  account_calls: AccountCall[];
};

type TransactionHistory = {
  block_hash: string;
  block_number: number;
  transaction_hash: string;
  event_index: number;
  from_address: string;
  transfer_from_address: string;
  transfer_to_address: string;
  transfer_amount: string;
  invocation_type: "FUNCTION" | "FEE_TRANSFER";
  timestamp: number;
};

type TransactionHistoryResponse = {
  next_url: string | null;
  data: TransactionHistory[];
};

export type {
  TokenBalance,
  TokenBalancesResponse,
  TokenContract,
  TransactionHistoryResponse,
  TransactionResponse,
};
