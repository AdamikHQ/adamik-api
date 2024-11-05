import { Pagination, Validator } from "~/app/model/types_WIP";
import { getValidatorsCached } from "../backend/node";
import { CosmosService } from "../service";

async function getValidators(this: CosmosService, pagination?: Pagination): Promise<Validator[]> {
  const validatorsData = await getValidatorsCached(this.chainId, pagination);
  return validatorsData.map((validatorData) => {
    const validator: Validator = {
      address: validatorData.operator_address,
      name: validatorData.description?.moniker,
    };

    if (validatorData.commission?.commission_rates?.rate !== undefined) {
      validator.commission = Number(validatorData.commission?.commission_rates?.rate) * 100;
    }

    if (validatorData.tokens !== undefined) {
      validator.stakedAmount = BigInt(validatorData.tokens);
    }

    return validator;
  });
}

export { getValidators };
