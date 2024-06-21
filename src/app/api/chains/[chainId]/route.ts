import { NextRequest, NextResponse } from "next/server";
import { ChainId } from "~/app/model/types_WIP";
import { CHAINS, displayChains } from "~/app/config/chains";

type Params = {
  chainId: ChainId;
};

export async function GET(_: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId } = context.params;

  if (!chainId) {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400, statusText: "Path param `chainId` is required" }
    );
  }

  const chain = displayChains[chainId];

  if (!chain) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  return NextResponse.json(chain);
}
