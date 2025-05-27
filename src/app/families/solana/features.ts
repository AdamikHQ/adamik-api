import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const SOLANA_FEATURES: ChainSupportedFeatures = {
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
        memo: true,
      },
    },
  },
  utils: {
    addresses: true,
  },
};

export { SOLANA_FEATURES };
