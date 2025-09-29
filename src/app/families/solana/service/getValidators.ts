import { ChainValidators, Paginated } from "~/app/model/types_WIP";
import { getValidatorsCached } from "../backend/validatorApp";
import { SolanaService } from "../service";

export async function getValidators(
  this: SolanaService,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  const validatorsData = await getValidatorsCached(this.chainId, paginationToken);

  return {
    validators: validatorsData.validators,
    pagination: {
      nextPage: validatorsData.pagination.nextPage,
    },
  };
}
