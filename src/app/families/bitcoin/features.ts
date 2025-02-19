import { ChainSupportedFeatures } from "~/app/model/types_WIP";

const BITCOIN_FEATURES: ChainSupportedFeatures = {
  // TODO Enable staking on bitcoin mainnet when live
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
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: false,
        stake: false,
        unstake: false,
        claimRewards: false,
        withdraw: false,
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

// TODO Support staking for read & write operations
// FIXME Staking supported only by bitcoin but not other chains
const BITCOIN_SIGNET_FEATURES: ChainSupportedFeatures = {
  read: {
    token: false,
    validators: false,
    account: {
      balances: { native: false, tokens: false, staking: true }, // TODO
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: false, tokens: false, staking: true }, // TODO
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: false,
        stake: true,
        unstake: true, // TODO
        claimRewards: false,
        withdraw: true, // TODO
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
