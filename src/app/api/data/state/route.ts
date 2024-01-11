import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { services } from "~/app/chains/services";
import { getAddressState } from "~/app/chains/algorand/service/getAddressState";
import { AddressState, ChainId } from "~/app/model/types_WIP";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization
  const { chain, address } = await request.json();

  if (!chain) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Field `chain` is required",
    });
  }

  if (!address) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Field `address` is required",
    });
  }

  const service = services.get(chain);
  if (!service) {
    return new NextResponse(null, {
      status: 501,
      statusText: `Unsupported chain: ${chain}`,
    });
  }

  const state = await service.getAddressState(address);

  return NextResponse.json(state);
  //return new Response(JSON.stringify(isValid));
}
