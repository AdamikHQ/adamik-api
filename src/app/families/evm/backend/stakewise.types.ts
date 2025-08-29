import { ChainId } from "~/app/model/types_WIP";
import { EvmAddress } from "../types";

const STAKEWISE_SUPPORTED_CHAIN_IDS: ChainId[] = [ChainId.ETHEREUM, ChainId.HOODI];

type AllocatorsResponse = {
  data: {
    allocators: AllocatorData[];
  };
};

type ExitRequest = {
  id: string;
  exitQueueIndex: string;
  positionTicket: string;
  totalAssets: string;
  timestamp: string; // Provided in seconds
  withdrawalTimestamp?: string; // Provided in seconds
  isClaimable: boolean;
  isClaimed: boolean;
};

type DepositedEvent = {
  caller: EvmAddress;
  receiver: EvmAddress;
  assets: bigint;
  shares: bigint;
  referrer: EvmAddress;
};

type ExitQueueEnteredEvent = {
  owner: EvmAddress;
  receiver: EvmAddress;
  positionTicket: bigint;
  shares: bigint;
};

type ExitedAssetsClaimed = {
  receiver: EvmAddress;
  prevPositionTicket: bigint;
  newPositionTicket: bigint;
  withdrawnAssets: bigint;
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

export { STAKEWISE_SUPPORTED_CHAIN_IDS };
export type {
  AllocatorData,
  AllocatorsResponse,
  DepositedEvent,
  ExitedAssetsClaimed,
  ExitQueueEnteredEvent,
  ExitRequest,
  HarvestParams,
};
