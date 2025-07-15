import { Network as StakeWiseNetwork, StakeWiseSDK } from "@stakewise/v3-sdk";
import { CHAINS } from "~/app/config/chains";
import { ChainId, ProviderType, StakingPosition, StakingStatus, Validator } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { AllocatorsResponse } from "./stakewise.types";

// TODO Proper error management

const SUPPORTED_CHAIN_IDS: ChainId[] = [ChainId.ETHEREUM, ChainId.HOODI];

const getSDKConfig = (chainId: ChainId): StakeWise.Options => {
  switch (chainId) {
    case ChainId.ETHEREUM:
      return {
        network: StakeWiseNetwork.Mainnet,
        endpoints: {
          web3: CHAINS[chainId].providers.find((provider) => provider.type === ProviderType.node)?.urls[0],
        },
      };
    case ChainId.HOODI:
      return {
        network: StakeWiseNetwork.Hoodi,
        endpoints: {
          web3: CHAINS[chainId].providers.find((provider) => provider.type === ProviderType.node)?.urls[0],
        },
      };
    default:
      console.warn(`/!\\ Staking with StakeWise not supported for chain ${chainId}`);
      throw new UserInputError(`Staking with StakeWise not supported for chain ${chainId}`);
  }
};

const initStakeWiseSDK = (chainId: ChainId) => {
  return new StakeWiseSDK(getSDKConfig(chainId));
};

async function getHarvestParams(chainId: ChainId, vaultAddress: string) {
  const sdk = initStakeWiseSDK(chainId);

  return sdk.vault.getHarvestParams({
    vaultAddress,
  });
}

async function fetchStakingPositions(chainId: ChainId, vaultAddress: string): Promise<StakingPosition[]> {
  const stakewiseURL = CHAINS[chainId].providers.find(
    (provider) => provider.type === ProviderType.stakewiseGQL
  )?.urls[0];

  if (!stakewiseURL) {
    throw new UserInputError(`Staking with StakeWise not supported for chain ${chainId}`);
  }

  const response = await fetch(`${stakewiseURL}?opName=Allocators`, {
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

  const {
    data: { allocators },
  }: AllocatorsResponse = await response.json();

  return allocators.map((allocator) => ({
    validatorAddresses: [allocator.vault.id],
    amount: BigInt(allocator.assets),
    status: StakingStatus.LOCKED,
  }));
}

// NOTE This provides StakeWise vaults as validators
async function fetchValidators(
  chainId: ChainId,
  paginationToken?: string
): Promise<{ validators: Validator[]; nextPage: string | null }> {
  const stakewiseURL = CHAINS[chainId].providers.find(
    (provider) => provider.type === ProviderType.stakewiseGQL
  )?.urls[0];

  if (!stakewiseURL) {
    throw new UserInputError(`Staking with StakeWise not supported for chain ${chainId}`);
  }

  const paginationData = paginationFromB64(paginationToken) as { skip: number } | null;
  const skip = paginationData?.skip || 0;
  const first = 50;

  const response = await fetch(`${stakewiseURL}?opName=Vaults`, {
    method: "POST",
    body: JSON.stringify({
      query: `
        query Vaults($skip: Int, $first: Int, $orderBy: Vault_orderBy) {
          vaults(
            skip: $skip,
            first: $first,
            orderBy: $orderBy,
            orderDirection: desc
          ) {
            id
            displayName
            totalAssets
            apy
          }
        }
      `,
      variables: {
        skip,
        first,
        orderBy: "totalAssets",
      },
      operationName: "Vaults",
    }),
  });

  const data = await response.json();
  const vaults = data.data?.vaults || [];

  const validators: Validator[] = vaults.map((vault: any) => ({
    address: vault.id,
    name: vault.displayName || "",
    stakedAmount: BigInt(vault.totalAssets),
    commission: vault.apy ? parseFloat(vault.apy) : undefined,
  }));

  // Calculate next page token
  const nextPage = vaults.length === first ? paginationToB64({ skip: skip + first }) : null;

  return {
    validators,
    nextPage,
  };
}

export { fetchStakingPositions, fetchValidators, getHarvestParams, SUPPORTED_CHAIN_IDS };
