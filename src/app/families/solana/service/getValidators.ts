import { ChainValidators, Paginated } from "~/app/model/types_WIP";
import { fetchValidators } from "../backend/validatorApp";
import { SolanaService } from "../service";

export async function getValidators(
  this: SolanaService,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  const validatorsData = await fetchValidators(paginationToken);

  return {
    validators: validatorsData.validators,
    pagination: {
      nextPage: validatorsData.pagination.nextPage,
    },
  };
}
