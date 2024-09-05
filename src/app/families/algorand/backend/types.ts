// TODO zod schemas to also validate response payloads

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

type AlgoTransaction = {
  id: string;
  currentRound: bigint;
  confirmedRound: number;
  roundTime: number;
  sender: string;
  fee: bigint;
  note?: string;
} & (
  | {
      txType: "pay";
      paymentTransaction: {
        amount: bigint;
        receiver: string;
      };
    }
  | {
      txType: "axfer";
      assetTransferTransaction: {
        amount: bigint;
        assetId: number;
        receiver: string;
      };
    }
);

export type {
  AlgoAccount,
  AlgoAsset,
  AlgoAssetAmount,
  AlgoTransaction,
  AlgoTransactionBroadcastResponse,
  AlgoTransactionParams,
};
