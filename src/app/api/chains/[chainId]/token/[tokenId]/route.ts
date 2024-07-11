import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { isTokenService } from "~/app/model/service";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { responseSchema, urlParamsSchema } from "./schema";

export const GET = apiHandlerWrapper(async (_, { chainId, tokenId }) => {
  const service = getService(chainId);

  if (!isTokenService(service)) {
    return NextResponse.json(
      { message: `Tokens are not supported for chain ID ${chainId}` },
      { status: 400, statusText: "Invalid chainId" }
    );
  }

  const token = await service.getTokenInfo(tokenId);

  return token
    ? NextResponse.json(token)
    : NextResponse.json(
      { message: `Token ID ${tokenId} is not supported for chain ID ${chainId}` },
      { status: 400, statusText: `Unsupported tokenId` }
    );
}, {
  urlParamsSchema,
  responseSchema
})
