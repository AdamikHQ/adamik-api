type fetchAllocationResponse = {
  data: {
    allocators: {
      id: string;
      assets: string;
      vault: {
        id: string;
        displayName: string;
      };
    }[];
  };
};

export type { fetchAllocationResponse };
