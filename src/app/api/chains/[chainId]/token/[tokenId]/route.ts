import { NextRequest, NextResponse } from "next/server";
import { ChainId } from "~/app/model/types_WIP";
import { isTokenService } from "~/app/model/service";
import { SERVICES } from "~/app/families/services";

type Params = {
  chainId: ChainId;
  tokenId: string;
};

export async function GET(_: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId, tokenId } = context.params;

  // TODO Use zod / apply requestSchema

  if (!chainId) {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400, statusText: "Path param `chainId` is required" }
    );
  }

  if (!tokenId) {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400, statusText: "Path param `tokenId` is required" }
    );
  }

  const service = SERVICES.get(chainId);

  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

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
