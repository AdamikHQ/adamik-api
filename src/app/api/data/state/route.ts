import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { getAddressState } from "~/app/chains/algorand/service/getAddressState";
import { AddressState } from "~/app/model/types_WIP";

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

  let state: AddressState;
  switch (chain) {
    case "algorand":
      state = await getAddressState(address);
      break;
    default:
      return new NextResponse(null, {
        status: 400,
        statusText: `Unsupported chain: ${chain}`,
      });
  }

  return NextResponse.json(state);
  //return new Response(JSON.stringify(isValid));
}
