import { getService } from "~/app/families/services";
import { isStakingService } from "~/app/model/service";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, queryParamsSchema, responseSchema } from "./schema";

export const GET = apiHandler(
  {
    pathParamsSchema,
    queryParamsSchema,
    responseSchema,
  },
  async ({ pathParams, queryParams }) => {
    const { chainId } = pathParams;

    const paginationToken = queryParams.nextPage;

    const service = getService(chainId);

    if (!isStakingService(service)) {
      throw new UnsupportedFeatureError(`Staking is not supported for chainId ${chainId}`);
    }

    const { validators, nextPage } = await service.getValidators(paginationToken);

    const validatorsResponse = {
      chainId,
      validators,
      pagination: {
        nextPage,
      },
    };

    return validatorsResponse;
  }
);
