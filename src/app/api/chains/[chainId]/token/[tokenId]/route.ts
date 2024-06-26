import { NextRequest, NextResponse } from "next/server";
import { isTokenService } from "~/app/model/service";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/api/handlers/apiHandler";
import { z } from "zod";
import { requestSchema } from "./schema";

type Params = z.infer<typeof requestSchema>

export async function GET(_: NextRequest, context: { params: Params}): Promise<NextResponse> {
  const { chainId, tokenId } = requestSchema.parse(context.params);

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
}

module.exports = apiHandler({
  GET
});