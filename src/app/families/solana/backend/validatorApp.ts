import TTLCache from "@isaacs/ttlcache";
import { SOLANA_VALIDATORS_APP_API_KEY } from "~/app/config/apiKeys";
import { ChainId, ChainValidators, Paginated, ProviderType } from "~/app/model/types_WIP";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { getProviderUrls } from "../../common";
import { ValidatorList } from "./validatorApp.types";

const VALIDATORS_CACHE = new TTLCache<string, Paginated<ChainValidators>>({
  max: 10, // Up to 10 pagination pages
  ttl: 1000 * 60 * 60, // Cache expiration = 1h
});

// https://www.validators.app/api-documentation?locale=en&network=mainnet#validators-list
async function fetchValidators(
  chainId: ChainId,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  let validatorPage = 1;
  if (paginationToken) {
    const { page } = paginationFromB64(paginationToken) as { page: number };
    if (!page) {
      throw new InvalidPaginationTokenError("Invalid pagination token");
    }
    validatorPage = page;
  }

  try {
    const urls = getProviderUrls(chainId, ProviderType.validatorApp);
    const url = `${urls[0]}?order=stake&active_only=true&limit=100&page=${validatorPage}`;
    const response = await fetch(url, {
      headers: {
        Token: SOLANA_VALIDATORS_APP_API_KEY,
        "Content-Type": "application/json",
      },
    });
    const validators: ValidatorList = await response.json();

    const nextPage = validators.length === 100 ? paginationToB64({ page: validatorPage + 1 }) : null;

    return {
      validators: validators.map((validator) => ({
        address: validator.vote_account,
        name: validator.name ?? validator.account,
        commission: Number(validator.commission),
        stakedAmount: BigInt(validator.active_stake),
      })),
      pagination: {
        nextPage,
      },
    };
  } catch (error) {
    console.warn("Error fetching validators from validatorApp", error);
    throw new ThirdPartyProviderError("Error fetching validators for Solana");
  }
}

async function getValidatorsCached(
  chainId: ChainId,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  const cacheKey = `validators-${chainId}-${paginationToken}`;

  const cachedValidators = VALIDATORS_CACHE.get(cacheKey);

  if (cachedValidators) {
    return cachedValidators;
  } else {
    const newValidators = await fetchValidators(chainId, paginationToken);
    VALIDATORS_CACHE.set(cacheKey, newValidators);
    return newValidators;
  }
}

export { getValidatorsCached };
