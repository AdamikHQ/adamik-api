import { ChainValidators, Paginated } from "~/app/model/types_WIP";
import { fetchValidators } from "../backend/validatorApp";
import { SolanaService } from "../service";

export async function getValidators(
  this: SolanaService,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  const validators = await fetchValidators(paginationToken);

  return {
    validators: validators.validators,
    pagination: {
      nextPage: validators.pagination.nextPage,
    },
  };
}
