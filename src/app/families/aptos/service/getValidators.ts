import { ChainValidators, Paginated } from "~/app/model/types_WIP";
import { getValidators as getValidatorsFn } from "~/app/families/aptos/backend/node";

export async function getValidators(): Promise<Paginated<ChainValidators>> {
  const validatorSet = await getValidatorsFn();
  console.log(validatorSet);
  const validators = validatorSet.data.active_validators;

  return {
    validators: validators.map((validator) => ({
      address: validator.addr,
      name: validator.addr,
      stakedAmount: BigInt(validator.voting_power),
    })),
    pagination: {
      nextPage: null,
    },
  };
}
