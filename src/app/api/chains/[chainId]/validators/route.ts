import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { isStakingService } from "~/app/model/service";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema, urlParamsSchema } from "./schema";


// TODO Make sure to document this implicit limit in the doc / swagger description
// We could also add something in the response to help user know what to fetch next (next limit, next URL...)
const VALIDATORS_LIMIT = 100;

export const POST = apiHandlerWrapper(async ({ pagination }, { chainId }) => {
  const service = getService(chainId);

  if (!isStakingService(service)) {
    return NextResponse.json(
      { message: `Staking is not supported for chain ID ${chainId}` },
      { status: 400, statusText: "Invalid chainId" }
    );
  }

  const validators = pagination ? await service.getValidators(pagination) : await service.getValidators();

  const validatorsResponse = {
    chainId,
    validators,
  };

  return NextResponse.json(validatorsResponse);
}, {
  requestSchema,
  responseSchema,
  urlParamsSchema
});
