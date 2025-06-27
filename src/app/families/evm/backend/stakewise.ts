import { Network, StakeWiseSDK } from "@stakewise/v3-sdk";
import { CHAINS } from "~/app/config/chains";
import { ChainId, ProviderType, StakingPosition, StakingStatus } from "~/app/model/types_WIP";
import { fetchAllocationResponse } from "./stakewise.types";

const getSDKConfig = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.ETHEREUM:
      return {
        network: Network.Mainnet,
        endpoints: {
          web3: CHAINS[chainId].providers.find((provider) => provider.type === ProviderType.node)?.urls[0],
        },
      };
    case ChainId.HOODI:
      return {
        network: Network.Hoodi,
        endpoints: {
          web3: CHAINS[chainId].providers.find((provider) => provider.type === ProviderType.node)?.urls[0],
        },
      };
    default:
      throw new Error(`Chain ${chainId} not supported`);
  }
};

const initStakeWiseSDK = (chainId: ChainId) => {
  const sdk = new StakeWiseSDK(getSDKConfig(chainId));

  return sdk;
};

async function getHarvestParams(chainId: ChainId, vaultAddress: string) {
  const sdk = initStakeWiseSDK(chainId);

  return sdk.vault.getHarvestParams({
    vaultAddress,
  });
}

async function fetchStakePosition(chainId: ChainId, vaultAddress: string): Promise<StakingPosition[]> {
  const url = CHAINS[chainId].providers.find((provider) => provider.type === ProviderType.stakewiseGQL)
    ?.urls[0];
  if (!url) {
    throw new Error(`No URL found for chain ${chainId}`);
  }

  const response = await fetch(`${url}?opName=Allocators`, {
    method: "POST",
    body: JSON.stringify({
      query: `
          query MyQuery($address: Bytes = "${vaultAddress}") {
            allocators(where: {address: $address}) {
              id
              assets
              vault {
                id
                displayName
              }
            }
          }
      `,
    }),
  });

  const data: fetchAllocationResponse = await response.json();
  return data.data.allocators.map((allocator) => ({
    validatorAddresses: [allocator.vault.id],
    amount: BigInt(allocator.assets),
    status: StakingStatus.LOCKED,
  }));
}

export { fetchStakePosition, getHarvestParams };
