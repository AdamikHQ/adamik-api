import { ChainId } from "~/app/model/types_WIP";
import { fetchValidators } from "../backend/node";
import { CosmosValidator } from "../backend/types";
import { ValidatorResponse } from "~/app/model/validator";

async function getValidators(
  chainId: ChainId,
  offset: number,
  limit: number
): Promise<ValidatorResponse<CosmosValidator>> {
  const response = await fetchValidators(chainId, offset, limit);
  return {
    validators: response.validators.map((validator) => ({
      address: validator.operator_address,
      name: validator.description.moniker,
      commission: Number(validator.commission.commission_rates.rate) * 100,
      maxCommission: Number(validator.commission.commission_rates.max_rate) * 100,
      website: validator.description.website,
      status: validator.status,
      raw: validator,
    })),
  };
}

export { getValidators }
