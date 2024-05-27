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

  const chain = CHAINS[chainId as ChainId];

  // FIXME Trick to filter-out private 'backends' field from response
  // Needs to be handled with DTO instead
  const response = (({ backends, ...chain }) => chain)(chain);

  return NextResponse.json(response);
}
