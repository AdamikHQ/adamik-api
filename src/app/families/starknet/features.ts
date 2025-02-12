import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const STARKNET_FEATURES: ChainSupportedFeatures = {
  read: {
    token: true,
    validators: true,
    account: {
      balances: { native: true, tokens: true, staking: false },
      transactions: { native: true, tokens: true, staking: false },
    },
    transaction: { native: true, tokens: true, staking: false },
  },
  write: {
    transaction: {
      type: {
        deployAccount: true,
        transfer: true,
        transferToken: true,
        stake: false,
        unstake: false,
        claimRewards: false,
      },
      field: {
        memo: false,
      },
    },
  },
  utils: {
    addresses: true,
  },
};

export { STARKNET_FEATURES };
