import { ChainValidators, Paginated, Validator } from "~/app/model/types_WIP";
import { fetchValidators } from "../backend/indexer";
import { StarknetService } from "../service";

async function getValidators(
  this: StarknetService,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  const { validators: starknetValidators, nextPage } = await fetchValidators(paginationToken);

  const validators = starknetValidators.map((validatorData) => {
    const validator: Validator = {
      address: validatorData.staker_address,
      name: validatorData.name_tag ?? validatorData.staker_address,
    };

    if (validatorData.commission !== undefined) {
      validator.commission = Number(validatorData.commission) * 100;
    }

    if (validatorData.total_stake_amount !== undefined) {
      validator.stakedAmount = BigInt(validatorData.total_stake_amount);
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
