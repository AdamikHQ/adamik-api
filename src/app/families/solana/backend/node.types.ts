type GetAssetsByOwnerParams = {
  ownerAddress: string;
  page: number;
  limit: number;
  sortBy: {
    sortBy: string;
    sortDirection: string;
  };
  options: {
    showUnverifiedCollections: boolean;
    showCollectionMetadata: boolean;
    showGrandTotal: boolean;
    showFungible: boolean;
    showNativeBalance: boolean;
    showInscription: boolean;
    showZeroBalance: boolean;
  };
};

interface ProgramAccount {
  pubkey: string;
  account: {
    lamports: number;
    data: {
      type: string;
      data: number[];
    };
    owner: string;
    executable: boolean;
    rentEpoch: number;
    space: number;
  };
}

type ProgramAccountResponse = ProgramAccount[];

interface ParsedStakeAccountInfo {
  program: string;
  parsed: {
    info: {
      meta: {
        authorized: {
          staker: string;
          withdrawer: string;
        };
        lockup: {
          custodian: string;
          epoch: number;
          unixTimestamp: number;
        };
        rentExemptReserve: string;
      };
      stake: {
        creditsObserved: number;
        delegation: {
          activationEpoch: string;
          deactivationEpoch: string;
          stake: string;
          voter: string;
          warmupCooldownRate: number;
        };
      };
    };
    type: string;
  };
  space: number;
}

export type { GetAssetsByOwnerParams, ParsedStakeAccountInfo, ProgramAccountResponse };
