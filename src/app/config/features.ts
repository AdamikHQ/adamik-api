import { ALGORAND_FEATURES } from "../families/algorand/features";
import { BITCOIN_FEATURES } from "../families/bitcoin/features";
import { COSMOS_FEATURES } from "../families/cosmos/features";
import { EVM_FEATURES } from "../families/evm/features";
import { STARKNET_FEATURES } from "../families/starknet/features";
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
      type: {
        deployAccount: false,
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
    addresses: false,
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
      type: {
        deployAccount: false,
        transfer: false,
        transferToken: false,
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

export {
  ALGORAND_FEATURES,
  BITCOIN_FEATURES,
  COSMOS_FEATURES,
  EVM_FEATURES,
  EVM_ROOTSTOCK_FEATURES,
  NATIVE_READ_WRITE_ONLY,
  STARKNET_FEATURES,
  TON_FEATURES,
  TRON_FEATURES,
};
