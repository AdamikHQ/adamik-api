import { produce } from "immer";
import { ChainId, ChainSupportedFeatures } from "~/app/model/types_WIP";

// Defined here to avoid circular dependency in mintscan.ts
const MINTSCAN_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.COSMOSHUB, "cosmos"],
  [ChainId.OSMOSIS, "osmosis"],
  [ChainId.CELESTIA, "celestia"],
  [ChainId.DYDX, "dydx"],
  [ChainId.AXELAR, "axelar"],
  [ChainId.INJECTIVE, "injective"],
  [ChainId.AKASH, "akash"],
  [ChainId.NEUTRON, "neutron"],
  [ChainId.EVMOS, "evmos"],
  [ChainId.JUNO, "juno"],
  [ChainId.SEI, "sei"],
  [ChainId.STRIDE, "stride"],
  [ChainId.KAVA, "kava"],
  [ChainId.BABYLON, "babylon"],
  [ChainId.BABYLON_TESTNET, "babylon-testnet"],
  //NOT SUPPORTED BY MINTSCAN YET
  // [ChainId.IRISNET, "iris"],
  // [ChainId.TERRA, "terra2"],
  // [ChainId.LUM_NETWORK, "lum"],
  // [ChainId.OMNIFLIX, "omniflix"],
  // [ChainId.STARGAZE, "stargaze"],
  // [ChainId.BAND, "band"],
  // [ChainId.DYMENSION, "dymension"],
  // [ChainId.KYVE, "kyve"],
  // [ChainId.CHIHUAHUA, "chihuahua"],
  // [ChainId.SEDA, "seda"],
  // [ChainId.SHENTU, "shentu"],
]);

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
        deployAccount: false,
        transfer: true,
        transferToken: false,
        stake: true,
        unstake: true,
        claimRewards: true,
        withdraw: false,
        registerStake: false,
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

// Babylon has only one difference: support of the registerStake tx type
const COSMOS_BABYLON_FEATURES = (chainId: ChainId): ChainSupportedFeatures =>
  produce(COSMOS_FEATURES(chainId), (features) => {
    features.write.transaction.type.registerStake = true;
  });

export { COSMOS_BABYLON_FEATURES, COSMOS_FEATURES, MINTSCAN_CHAIN_IDS };
