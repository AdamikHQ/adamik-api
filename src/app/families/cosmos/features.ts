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
      type: { native: true, tokens: false, staking: true },
      field: {
        memo: true,
      },
    },
  },
});

export { COSMOS_FEATURES };
