import { NextRequest, NextResponse } from "next/server";
import { ChainId } from "~/app/model/types_WIP";
import { chains } from "~/app/chains/definitions";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const urlNodes = request.url.split("/");
  const chainId = urlNodes[urlNodes.length - 1];

  if (!chainId) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Path param `chainId` is required",
    });
  }
  if (!Object.keys(chains).includes(chainId)) {
    return new NextResponse(null, {
      status: 400,
      statusText: `Unsupported chain '${chainId}'`,
    });
  }

  return NextResponse.json(chains[chainId as ChainId]);
}
