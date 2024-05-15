import { ValidatorResponse } from "~/app/model/validator";
import { fetchValidators } from "../backend/node";
import { CosmosService } from ".";

async function getValidators(this: CosmosService, offset: number, limit: number): Promise<ValidatorResponse> {
  const response = await fetchValidators(this.chainId, offset, limit);
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

export { getValidators };
