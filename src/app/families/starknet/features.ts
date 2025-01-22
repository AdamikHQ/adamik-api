import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const STARKNET_FEATURES: ChainSupportedFeatures = {
  read: {
    token: false,
    validators: false,
    account: {
      balances: { native: true, tokens: false, staking: false },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: false, tokens: false, staking: false },
  },
  write: {
    transaction: {
      type: { native: true, tokens: true, staking: false },
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
