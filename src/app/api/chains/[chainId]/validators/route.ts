import { getService } from "~/app/families/services";
import { isStakingService } from "~/app/model/service";
import { AdamikResponse, apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, requestSchema, responseSchema } from "./schema";

// TODO Make sure to document this implicit limit in the doc / swagger description
// We could also add something in the response to help user know what to fetch next (next limit, next URL...)
const VALIDATORS_LIMIT = 100;

export const POST = apiHandlerWrapper(
  async ({ pagination }, { chainId }) => {
    const service = getService(chainId);

    if (!isStakingService(service)) {
      throw new UnsupportedFeatureError(`Staking is not supported for chainId ${chainId}`);
    }

    const validators = pagination ? await service.getValidators(pagination) : await service.getValidators();

    const validatorsResponse = {
      chainId,
      validators,
    };

    return AdamikResponse.json(validatorsResponse);
  },
  {
    requestSchema,
    responseSchema,
    pathParamsSchema,
  }
);
