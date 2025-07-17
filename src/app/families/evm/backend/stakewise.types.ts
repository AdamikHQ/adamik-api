type AllocatorsResponse = {
  data: {
    allocators: {
      id: string;
      assets: string;
      vault: {
        id: string;
      };
    }[];
  };
};

export type { AllocatorsResponse };
