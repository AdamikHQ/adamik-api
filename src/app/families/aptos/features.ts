import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const APTOS_FEATURES: ChainSupportedFeatures = {
  read: {
    token: true,
    validators: true,
    account: {
      balances: { native: true, tokens: true, staking: true },
      transactions: { native: true, tokens: true, staking: true },
    },
    transaction: { native: true, tokens: true, staking: true },
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: true,
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

export { APTOS_FEATURES };
