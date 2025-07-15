import { ChainValidators, Paginated } from "~/app/model/types_WIP";
import { fetchValidators } from "../backend/stakewise";
import { EvmService } from "../service";

async function getValidators(
  this: EvmService,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  // Only return Stakewise data, for chains that support it
  const { validators, nextPage } = await fetchValidators(this.chainId, paginationToken);

  return {
    validators,
    pagination: {
      nextPage,
    },
  };
}

export { getValidators };
