import { ChainValidators, Paginated, Validator } from "~/app/model/types_WIP";
import { fetchValidators } from "../backend/node";
import { CosmosService } from "../service";

async function getValidators(
  this: CosmosService,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  const { validators: cosmosValidators, nextPage } = await fetchValidators(this.chainId, paginationToken);

  const validators = cosmosValidators.map((validatorData) => {
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

  return {
    validators,
    pagination: {
      nextPage,
    },
  };
}

export { getValidators };
