import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const BITCOIN_FEATURES: ChainSupportedFeatures = {
  // TODO Support staking for read operations
  // FIXME Staking supported only by bitcoin but not other chains
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
      type: { native: true, tokens: false, staking: true },
      field: {
        memo: false,
      },
    },
  },
};

const BITCOIN_SIGNET_FEATURES: ChainSupportedFeatures = {
  read: {
    token: false,
    validators: false,
    account: {
      balances: { native: false, tokens: false, staking: false },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: false, tokens: false, staking: false },
  },
  write: {
    transaction: {
      type: { native: true, tokens: false, staking: true },
      field: {
        memo: false,
      },
    },
  },
};

export { BITCOIN_FEATURES, BITCOIN_SIGNET_FEATURES };
