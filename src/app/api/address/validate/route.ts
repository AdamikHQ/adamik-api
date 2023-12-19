import { NextRequest, NextResponse } from "next/server";
import { validateAddress } from "~/app/chains/algorand/service/validateAddress";

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

  let isValid = false;
  switch (chain) {
    case "algorand":
      isValid = validateAddress(address);
      break;
    default:
      return new NextResponse(null, {
        status: 400,
        statusText: `Unsupported chain: ${chain}`,
      });
  }

  return NextResponse.json(isValid);
  //return new Response(JSON.stringify(isValid));
}
