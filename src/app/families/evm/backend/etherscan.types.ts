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

export type { EtherscanERC20Event };
