import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { isTokenService } from "~/app/model/service";
import { deepBigintOrNumToString } from "~/app/tools/convertors/deepBigintToString";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { pathParamsSchema, responseSchema } from "./schema";

export const GET = apiHandlerWrapper(
  async (_, { chainId, tokenId }) => {
    const service = getService(chainId);

    if (!isTokenService(service)) {
      return NextResponse.json(
        { message: `Tokens are not supported for chainId ${chainId}` },
        { status: 400, statusText: "Unsupported feature" }
      );
    }

    const token = await service.getTokenInfo(tokenId);

    return token
      ? NextResponse.json(deepBigintOrNumToString(token))
      : NextResponse.json(
          { message: `Token ID ${tokenId} is not supported for chain ID ${chainId}` },
          { status: 400, statusText: `Unsupported tokenId` }
        );
  },
  {
    pathParamsSchema,
    responseSchema,
  }
);
