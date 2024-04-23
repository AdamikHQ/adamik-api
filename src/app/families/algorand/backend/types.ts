type AlgoAccount = {
  round: number;
  address: string;
  balance: bigint;
  pendingRewards: bigint;
  assets: AlgoAsset[];
};

type AlgoAsset = {
  assetId: string;
  balance: bigint;
};

type AlgoTransactionParams = {
  fee: number;
  minFee: number;
  firstRound: number;
  lastRound: number;
  genesisHash: string;
  genesisID: string;
};

type AlgoTransactionBroadcastResponse = {
  txId: string;
  message?: string;
};

export type {
  AlgoAccount,
  AlgoAsset,
  AlgoTransactionParams,
  AlgoTransactionBroadcastResponse,
};
