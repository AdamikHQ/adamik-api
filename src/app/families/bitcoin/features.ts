import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const BITCOIN_FEATURES: ChainSupportedFeatures = {
  read: {
    token: false,
    validators: false,
    account: {
      balances: { native: true, tokens: false, staking: false },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: true, tokens: false, staking: false },
  },
  write: {
    transaction: {
      type: { native: true, tokens: false, staking: false },
      field: {
        memo: false,
      },
    },
  },
  utils: {
    addresses: true,
  },
};

export { BITCOIN_FEATURES };
