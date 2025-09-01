import { ChainId } from "~/app/model/types_WIP";
import { EvmAddress, HexString } from "../types";

const MORALIS_SUPPORTED_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.ETHEREUM, "eth"],
  [ChainId.SEPOLIA, "sepolia"],
  [ChainId.HOLESKY, "holesky"],
  [ChainId.POLYGON, "polygon"],
  [ChainId.POLYGON_AMOY, "polygon amoy"],
  [ChainId.ARBITRUM, "arbitrum"],
  // no indexer for Sepolia with Moralis, to update later or switch to Etherscan
  // [ChainId.ARBITRUM_SEPOLIA, "arbitrum sepolia"],
  [ChainId.OPTIMISM, "optimism"],
  // no indexer for Sepolia with Moralis, to update later or switch to Etherscan
  // [ChainId.OPTIMISM_SEPOLIA, "optimism sepolia"],
  [ChainId.BASE, "base"],
  [ChainId.BASE_SEPOLIA, "base sepolia"],
  [ChainId.BSC, "bsc"],
  [ChainId.BSC_TESTNET, "bsc testnet"],
  [ChainId.LINEA, "linea"],
  [ChainId.LINEA_SEPOLIA, "linea sepolia"],
  [ChainId.AVALANCHE, "avalanche"],
  [ChainId.GNOSIS, "gnosis"],
  [ChainId.GNOSIS_CHIADO, "gnosis testnet"],
  [ChainId.MOONBEAM, "moonbeam"],
  [ChainId.MOONRIVER, "moonriver"],
  [ChainId.MOONBASE, "moonbase"],
  [ChainId.FANTOM, "fantom"],
  //Mantle may not be supported yet (marked as coming soon by Moralis)
  //[ChainId.MANTLE, "mantle"],
  [ChainId.CRONOS, "cronos"],
]);

type MoralisTransaction = {
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
  logs: MoralisLog[];
};

type MoralisLog = {
  log_index: string;
  transaction_hash: HexString;
  transaction_index: string;
  address: HexString;
  data: HexString;
  topic0: HexString;
  topic1: HexString;
  topic2: HexString;
  topic3: HexString;
  block_timestamp: string;
  block_number: string;
  block_hash: HexString;
};

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

type MoralisTransactionsResponse = {
  page: string;
  page_size: string;
  cursor: string;
  result: MoralisTransaction[];
  message?: string;
};

export { MORALIS_SUPPORTED_CHAIN_IDS };
export type { MoralisERC20Token, MoralisERC20TokenBalance, MoralisTransaction, MoralisTransactionsResponse };
