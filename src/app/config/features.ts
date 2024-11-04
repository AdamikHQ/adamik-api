import { ChainSupportedFeatures } from "../model/types_WIP";

// STANDARD FEATURES per family

const ALGORAND_FEATURES: ChainSupportedFeatures = {
  read: {
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
        memo: true,
      },
    },
  },
};

const COSMOS_FEATURES: ChainSupportedFeatures = {
  read: {
    account: {
      balances: { native: true, tokens: true, staking: true },
      transactions: { native: true, tokens: false, staking: true },
    },
    transaction: { native: true, tokens: false, staking: true },
  },
  write: {
    transaction: {
      type: { native: true, tokens: false, staking: true },
      field: {
        memo: true,
      },
    },
  },
};

const EVM_FEATURES: ChainSupportedFeatures = {
  read: {
    account: {
      balances: { native: true, tokens: true, staking: false },
      transactions: { native: true, tokens: true, staking: false },
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
};

const BITCOIN_FEATURES: ChainSupportedFeatures = {
  read: {
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
};

const TON_FEATURES: ChainSupportedFeatures = {
  read: {
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
        memo: true,
      },
    },
  },
};

const TRON_FEATURES: ChainSupportedFeatures = {
  read: {
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
};

// CUSTOM FEATURES - should be temporary and aligned with standard features if possible

const NATIVE_READ_WRITE_FEATURES: ChainSupportedFeatures = {
  read: {
    account: {
      balances: { native: true, tokens: false, staking: false },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: false, tokens: false, staking: false },
  },
  write: {
    transaction: {
      type: { native: true, tokens: false, staking: false },
      field: {
        memo: false,
      },
    },
  },
};

const EVM_ROOTSTOCK_FEATURES = {
  read: {
    account: {
      balances: { native: true, tokens: false, staking: false },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: false, tokens: false, staking: false },
  },
  write: {
    transaction: {
      //Issue with EIP-1559 txs on rootstock
      type: { native: false, tokens: false, staking: false },
      field: {
        memo: false,
      },
    },
  },
};

function generateCosmosFeatures(hasExplorer: boolean): ChainSupportedFeatures {
  return {
    read: {
      account: {
        balances: { native: true, tokens: true, staking: true },
        transactions: { native: hasExplorer, tokens: false, staking: hasExplorer },
      },
      transaction: { native: true, tokens: false, staking: true },
    },
    write: {
      transaction: {
        type: { native: true, tokens: false, staking: true },
        field: {
          memo: true,
        },
      },
    },
  };
}

export {
  ALGORAND_FEATURES,
  BITCOIN_FEATURES,
  EVM_FEATURES,
  EVM_ROOTSTOCK_FEATURES,
  generateCosmosFeatures,
  NATIVE_READ_WRITE_FEATURES,
  TON_FEATURES,
  TRON_FEATURES,
};
