import { ChainId, ChainSupportedFeatures } from "~/app/model/types_WIP";

const BITCOIN_FEATURES = (chainId: ChainId): ChainSupportedFeatures => ({
  read: {
    token: false,
    validators: isStakingSupported(chainId),
    account: {
      balances: { native: true, tokens: false, staking: isStakingSupported(chainId) },
      transactions: { native: false, tokens: false, staking: false },
    },
    transaction: { native: true, tokens: false, staking: isStakingSupported(chainId) },
  },
  write: {
    transaction: {
      type: {
        deployAccount: false,
        transfer: true,
        transferToken: false,
        enableToken: false,
        stake: isStakingSupported(chainId),
        unstake: isStakingSupported(chainId),
        claimRewards: false,
        withdraw: isStakingSupported(chainId),
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
});

function isStakingSupported(chainId: ChainId): boolean {
  // Only bitcoin chains that support staking at the moment
  return [ChainId.BITCOIN, ChainId.BITCOIN_SIGNET].includes(chainId);
}

export { BITCOIN_FEATURES };
