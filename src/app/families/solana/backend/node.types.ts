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

export type { GetAssetsByOwnerParams };
