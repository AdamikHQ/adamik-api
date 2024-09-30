import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { isTokenService } from "~/app/model/service";
import { deepBigintOrNumToString } from "~/app/tools/convertors/deepBigintToString";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, responseSchema } from "./schema";

export const GET = apiHandlerWrapper(
  async (_, { chainId, tokenId }) => {
    const service = getService(chainId);

    if (!isTokenService(service)) {
      throw new UnsupportedFeatureError(`Tokens are not supported for chainId ${chainId}`);
    }

    const token = await service.getTokenInfo(tokenId);

    return NextResponse.json(deepBigintOrNumToString(token));
  },
  {
    pathParamsSchema,
    responseSchema,
  }
);
