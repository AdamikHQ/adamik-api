import { ChainId, ChainSupportedFeatures } from "~/app/model/types_WIP";
import { MoralisIndexer } from "./backend/moralis";
import { AlchemyIndexer } from "./backend/alchemy";

const moralisSupport = (chainId: ChainId): boolean =>
  Boolean(MoralisIndexer.SUPPORTED_CHAIN_IDS.get(chainId));
const alchemySupport = (chainId: ChainId): boolean =>
  Boolean(AlchemyIndexer.SUPPORTED_CHAIN_IDS.get(chainId));
const anySupport = (chainId: ChainId): boolean => moralisSupport(chainId) || alchemySupport(chainId);

const EVM_FEATURES = (chainId: ChainId): ChainSupportedFeatures => ({
  read: {
    token: true,
    validators: false,
    account: {
      balances: { native: true, tokens: anySupport(chainId), staking: false },
      transactions: { native: anySupport(chainId), tokens: anySupport(chainId), staking: false },
    },
    transaction: { native: anySupport(chainId), tokens: anySupport(chainId), staking: false },
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: true,
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
});

export { EVM_FEATURES };
