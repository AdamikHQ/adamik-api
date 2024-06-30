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

export type { EtherscanERC20Event, MoralisERC20Token, MoralisERC20TokenBalance };
