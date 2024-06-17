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
  balance: string;
  possible_spam: boolean;
  //verified_collection: boolean,
  //total_supply: string,
  //total_supply_formatted: string,
  //percentage_relative_to_total_supply: number
};

export type { EtherscanERC20Event, MoralisERC20TokenBalance };
