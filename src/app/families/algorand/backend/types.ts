// TODO zod schemas to also validate response payloads

type AlgoAsset = {
  assetId: string;
  name: string;
  unitName: string;
  decimals: number;
};

type AlgoAssetAmount = {
  assetId: string;
  amount: number;
  //isFrozen: boolean;
};

type AlgoAccount = {
  round: number;
  address: string;
  balance: number;
  pendingRewards: number;
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
  currentRound: number;
  confirmedRound: number;
  roundTime: number;
  sender: string;
  fee: number;
  note?: string;
} & (
  | {
      txType: "pay";
      paymentTransaction: {
        amount: number;
        receiver: string;
      };
    }
  | {
      txType: "axfer";
      assetTransferTransaction: {
        amount: number;
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
