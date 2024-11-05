import { ALGORAND_FEATURES } from "../families/algorand/features";
import { BITCOIN_FEATURES } from "../families/bitcoin/features";
import { COSMOS_FEATURES } from "../families/cosmos/features";
import { EVM_FEATURES } from "../families/evm/features";
import { TON_FEATURES } from "../families/ton/features";
import { TRON_FEATURES } from "../families/tron/features";
import { ChainSupportedFeatures } from "../model/types_WIP";

// CUSTOM FEATURES - should be temporary and aligned with standard features if possible

const NATIVE_READ_WRITE_ONLY: ChainSupportedFeatures = {
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
      type: { native: true, tokens: false, staking: false },
      field: {
        memo: false,
      },
    },
  },
};

const EVM_ROOTSTOCK_FEATURES: ChainSupportedFeatures = {
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
      //Issue with EIP-1559 txs on rootstock
      type: { native: false, tokens: false, staking: false },
      field: {
        memo: false,
      },
    },
  },
};

export {
  ALGORAND_FEATURES,
  BITCOIN_FEATURES,
  COSMOS_FEATURES,
  EVM_FEATURES,
  EVM_ROOTSTOCK_FEATURES,
  NATIVE_READ_WRITE_ONLY,
  TON_FEATURES,
  TRON_FEATURES,
};
