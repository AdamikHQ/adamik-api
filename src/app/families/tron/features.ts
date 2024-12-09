import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const TRON_FEATURES: ChainSupportedFeatures = {
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
      type: { native: true, tokens: true, staking: false },
      field: {
        memo: false,
      },
    },
  },
  utils: {
    addresses: false,
  },
};

export { TRON_FEATURES };
