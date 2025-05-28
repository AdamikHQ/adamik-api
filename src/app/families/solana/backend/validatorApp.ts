import { SOLANA_VALIDATORS_APP_API_KEY } from "~/app/config/apiKeys";
import { ChainId, ChainValidators, Paginated, ProviderType } from "~/app/model/types_WIP";
import { InvalidPaginationTokenError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { getProviderUrls } from "../../common";
import { ValidatorList } from "./validatorApp.types";

// https://www.validators.app/api-documentation?locale=en&network=mainnet#validators-list
async function fetchValidators(paginationToken?: string): Promise<Paginated<ChainValidators>> {
  let validatorPage = 1;
  if (paginationToken) {
    const { page } = paginationFromB64(paginationToken) as { page: number };
    if (!page) {
      throw new InvalidPaginationTokenError("Invalid pagination token");
    }
    validatorPage = page;
  }

  try {
    const urls = getProviderUrls(ChainId.SOLANA, ProviderType.validatorApp);
    const url = `${urls[0]}/api/v1/validators/mainnet.json?order=stake&active_only=true&limit=100&page=${validatorPage}`;
    console.log(url);
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
        address: validator.account,
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
    throw new ThirdPartyProviderError("Error fetching validators from validatorApp");
  }
}

export { fetchValidators };
