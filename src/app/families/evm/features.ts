import { ChainId, ChainSupportedFeatures } from "~/app/model/types_WIP";
import { AlchemyIndexer } from "./backend/alchemy";
import { MoralisIndexer } from "./backend/moralis";
import { SUPPORTED_CHAIN_IDS as STAKEWISE_SUPPORTED_CHAIN_IDS } from "./backend/stakewise";

const moralisSupport = (chainId: ChainId): boolean =>
  Boolean(MoralisIndexer.SUPPORTED_CHAIN_IDS.get(chainId));
const alchemySupport = (chainId: ChainId): boolean =>
  Boolean(AlchemyIndexer.SUPPORTED_CHAIN_IDS.get(chainId));
const indexerSupport = (chainId: ChainId): boolean => moralisSupport(chainId) || alchemySupport(chainId);

const stakewiseSupport = (chainId: ChainId): boolean =>
  Boolean(STAKEWISE_SUPPORTED_CHAIN_IDS.includes(chainId));

const EVM_FEATURES = (chainId: ChainId): ChainSupportedFeatures => ({
  read: {
    token: true,
    validators: stakewiseSupport(chainId),
    account: {
      balances: { native: true, tokens: indexerSupport(chainId), staking: stakewiseSupport(chainId) },
      transactions: {
        native: indexerSupport(chainId),
        tokens: indexerSupport(chainId),
        staking: false,
      },
    },
    transaction: { native: indexerSupport(chainId), tokens: indexerSupport(chainId), staking: false },
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: true,
        stake: stakewiseSupport(chainId),
        unstake: false,
        claimRewards: false,
        withdraw: false,
        registerStake: false,
        convertAsset: true,
      },
      field: {
        memo: false,
      },
    },
  },
  utils: {
    addresses: true,
  },
});

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
        stake: false,
        unstake: false,
        claimRewards: false,
        withdraw: false,
        registerStake: false,
        convertAsset: false,
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

export { EVM_FEATURES, EVM_ROOTSTOCK_FEATURES };
