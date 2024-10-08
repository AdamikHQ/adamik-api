import { getService } from "~/app/families/services";
import { isStakingService } from "~/app/model/service";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    requestSchema,
    responseSchema,
    pathParamsSchema,
  },
  async ({ body, pathParams }) => {
    const { chainId } = pathParams;

    const { pagination } = body;

    const service = getService(chainId);

    if (!isStakingService(service)) {
      throw new UnsupportedFeatureError(`Staking is not supported for chainId ${chainId}`);
    }

    const validators = pagination ? await service.getValidators(pagination) : await service.getValidators();

    const validatorsResponse = {
      chainId,
      validators,
    };

    return validatorsResponse;
  }
);
