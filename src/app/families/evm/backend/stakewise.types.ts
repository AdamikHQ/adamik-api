type AllocatorsResponse = {
  data: {
    allocators: AllocatorData[];
  };
};

type ExitRequest = {
  id: string;
  //timestamp: string;
  //positionTicket: string;
  //totalShares: string;
  totalAssets: string;
  withdrawalTimestamp?: string; // Provided in seconds
};

type AllocatorData = {
  id: string;
  assets: string;
  shares: string;
  vault: {
    id: string;
  };
  exitRequests: ExitRequest[];
};

type HarvestParams = {
  canHarvest: boolean;
  params: {
    proof: string[];
    rewardsRoot: string;
    reward: string;
    unlockedMevReward: string;
  };
};

export type { AllocatorData, AllocatorsResponse, ExitRequest, HarvestParams };
