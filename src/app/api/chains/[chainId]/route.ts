import { NextRequest, NextResponse } from "next/server";
import { ChainId } from "~/app/model/types_WIP";
import { CHAINS } from "~/app/config/chains";

type Params = {
  chainId: string;
};

export async function GET(_: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId } = context.params;

  if (!chainId) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Path param `chainId` is required",
    });
  }
  if (!Object.keys(CHAINS).includes(chainId as string)) {
    return new NextResponse(null, {
      status: 400,
      statusText: `Unsupported chain '${chainId}'`,
    });
  }

  return NextResponse.json(CHAINS[chainId as ChainId]);
}
