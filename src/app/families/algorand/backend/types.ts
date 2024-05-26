type AlgoAsset = {
  assetId: string;
  name: string;
  unitName: string;
  decimals: number;
};

type AlgoAssetAmount = {
  assetId: string;
  amount: bigint;
  //isFrozen: boolean;
};

type AlgoAccount = {
  round: number;
  address: string;
  balance: bigint;
  pendingRewards: bigint;
  assetAmounts: AlgoAssetAmount[];
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
  AlgoAsset,
  AlgoAssetAmount,
  AlgoAccount,
  AlgoTransactionParams,
  AlgoTransactionBroadcastResponse,
};
