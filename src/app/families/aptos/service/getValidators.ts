import { ChainValidators, Paginated } from "~/app/model/types_WIP";
import { fetchValidators } from "~/app/families/aptos/backend/node";
import { AptosService } from "~/app/families/aptos/service";

export async function getValidators(this: AptosService): Promise<Paginated<ChainValidators>> {
  const validatorSet = await fetchValidators(this.chainId);
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
