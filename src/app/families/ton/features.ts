import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const TON_FEATURES: ChainSupportedFeatures = {
  read: {
    token: true,
    validators: false,
    account: {
      balances: { native: true, tokens: true, staking: false },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: true, tokens: true, staking: false },
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: true,
        stake: false,
        unstake: false,
        claimRewards: false,
        withdraw: false,
        registerStake: false,
        convertAsset: true,
      },
      field: {
        memo: true,
      },
    },
  },
  utils: {
    addresses: true,
  },
};

export { TON_FEATURES };
