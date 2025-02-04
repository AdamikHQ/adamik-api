import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const STARKNET_FEATURES: ChainSupportedFeatures = {
  read: {
    token: false,
    validators: false,
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
        delegate: false,
        redelegate: false,
        undelegate: false,
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
