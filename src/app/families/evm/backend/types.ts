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

type MoralisERC20TokenBalance = {
  token_address: EvmAddress;
  name: string;
  symbol: string;
  //logo: string,
  //thumbnail: string,
  decimals: number;
  native_token: boolean;
  possible_spam: false;
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

export type { EtherscanERC20Event, MoralisERC20TokenBalance };
