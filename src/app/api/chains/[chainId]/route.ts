import { NextRequest, NextResponse } from "next/server";
import { ChainId } from "~/app/model/types_WIP";
import { CHAINS } from "~/app/config/chains";

type Params = {
  chainId: string;
};

export async function GET(_: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId } = context.params;

  if (!chainId) {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400, statusText: "Path param `chainId` is required" }
    );
  }

  if (!Object.keys(CHAINS).includes(chainId as string)) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  return NextResponse.json(CHAINS[chainId as ChainId]);
}
