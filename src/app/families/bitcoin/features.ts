import { ChainSupportedFeatures } from "~/app/model/types_WIP";

// FIXME Staking supported only by bitcoin but not other chains
const BITCOIN_FEATURES: ChainSupportedFeatures = {
  read: {
    token: false,
    validators: true,
    account: {
      balances: { native: true, tokens: false, staking: true },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: true, tokens: false, staking: true },
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: false,
        stake: true,
        unstake: true,
        claimRewards: false,
        withdraw: true,
        registerStake: false,
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

const BITCOIN_SIGNET_FEATURES: ChainSupportedFeatures = {
  read: {
    token: false,
    validators: true,
    account: {
      balances: { native: false, tokens: false, staking: true },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: true, tokens: false, staking: true },
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: false,
        stake: true,
        unstake: true,
        claimRewards: false,
        withdraw: true,
        registerStake: false,
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

export { BITCOIN_FEATURES, BITCOIN_SIGNET_FEATURES };
