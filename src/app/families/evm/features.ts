import { ChainId, ChainSupportedFeatures } from "~/app/model/types_WIP";
import { MORALIS_CHAIN_IDS } from "./backend/moralis";

const moralisSupport = (chainId: ChainId): boolean => !!MORALIS_CHAIN_IDS.get(chainId);

const EVM_FEATURES = (chainId: ChainId): ChainSupportedFeatures => ({
  read: {
    token: moralisSupport(chainId),
    validators: false,
    account: {
      balances: { native: true, tokens: moralisSupport(chainId), staking: false },
      transactions: { native: moralisSupport(chainId), tokens: moralisSupport(chainId), staking: false },
    },
    transaction: { native: moralisSupport(chainId), tokens: moralisSupport(chainId), staking: false },
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
