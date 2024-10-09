import z from "zod";
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

    const offset = z.number().catch(0).parse(Number(queryParams.offset));
    const limit = z.number().catch(0).parse(Number(queryParams.limit));

    const service = getService(chainId);

    if (!isStakingService(service)) {
      throw new UnsupportedFeatureError(`Staking is not supported for chainId ${chainId}`);
    }

    const validators = await service.getValidators({ offset, limit });

    const validatorsResponse = {
      chainId,
      validators,
      // TODO
      // paginationNext: { limit, offset } | null;
    };

    return validatorsResponse;
  }
);
