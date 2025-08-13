import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const STELLAR_FEATURES: ChainSupportedFeatures = {
  read: {
    token: true, // TODO
    validators: false,
    account: {
      balances: { native: true, tokens: true, staking: false }, // TODO
      transactions: { native: true, tokens: true, staking: false }, // TODO
    },
    transaction: { native: true, tokens: true, staking: false }, // TODO
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true, // TODO
        transferToken: true, // TODO
        stake: false,
        unstake: false,
        claimRewards: false,
        withdraw: false,
        registerStake: false,
        convertAsset: false,
      },
      field: {
        memo: true, // TODO
      },
    },
  },
  utils: {
    addresses: true, // TODO
  },
};

export { STELLAR_FEATURES };
