import { ChainId, ChainSupportedFeatures } from "~/app/model/types_WIP";
import { MINTSCAN_CHAIN_IDS } from "./backend/mintscan";

const mintscanSupport = (chainId: ChainId): boolean => !!MINTSCAN_CHAIN_IDS.get(chainId);

const COSMOS_FEATURES = (chainId: ChainId): ChainSupportedFeatures => ({
  read: {
    token: true,
    validators: true,
    account: {
      balances: { native: true, tokens: true, staking: true },
      transactions: {
        native: mintscanSupport(chainId),
        tokens: false,
        staking: mintscanSupport(chainId),
      },
    },
    transaction: {
      native: mintscanSupport(chainId),
      tokens: false,
      staking: mintscanSupport(chainId),
    },
  },
  write: {
    transaction: {
      type: {
        deployAccount: true,
        transfer: true,
        transferToken: false,
        delegate: true,
        redelegate: true,
        undelegate: true,
        claimRewards: true,
      },
      field: {
        memo: true,
      },
    },
  },
  utils: {
    addresses: true,
  },
});

export { COSMOS_FEATURES };
