import { NextRequest, NextResponse } from "next/server";
import { isTokenService } from "~/app/model/service";
import { getService } from "~/app/families/services";
import { z } from "zod";
import { requestSchema } from "./schema";
import { apiHandler } from "~/app/tools/handlers/apiHandler";

type Params = z.infer<typeof requestSchema>;

export async function GET(_: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId, tokenId } = requestSchema.parse(context.params);

  const service = getService(chainId);

  if (!isTokenService(service)) {
    return NextResponse.json(
      { message: `Tokens are not supported for chainId ${chainId}` },
      { status: 400, statusText: "Unsupported feature" }
    );
  }

  const token = await service.getTokenInfo(tokenId);

  return token
    ? NextResponse.json(token)
    : NextResponse.json(
        { message: `Invalid tokenId ${tokenId} for chainId ${chainId}` },
        { status: 400, statusText: `Unsupported tokenId` }
      );
}

module.exports = apiHandler({
  GET,
});
