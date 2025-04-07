import { fetchBabylonFinalityProviders } from "~/app/families/cosmos/backend/babylon";
import { ChainValidators, Paginated, Validator } from "~/app/model/types_WIP";
import { BitcoinService } from "../service";

async function getValidators(
  this: BitcoinService,
  paginationToken?: string
): Promise<Paginated<ChainValidators>> {
  const { validators: babylonValidators, nextPage } = await fetchBabylonFinalityProviders(paginationToken);

  const validators = babylonValidators.map((validatorData) => {
    const validator: Validator = {
      address: validatorData.btc_pk,
      name: validatorData.description.moniker,
      commission: Number(validatorData.commission),
      stakedAmount: BigInt(validatorData.active_tvl),
    };

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
