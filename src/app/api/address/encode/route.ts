import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { pubkeyToAddress } from "~/app/chains/algorand/service/pubkeyToAddress";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization
  const { chain, pubkey } = await request.json();

  if (!chain) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Field `chain` is required",
    });
  }

  if (!pubkey) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Field `pubkey` is required",
    });
  }

  let address;
  switch (chain) {
    case "algorand":
      address = pubkeyToAddress(pubkey);
      break;
    default:
      return new NextResponse(null, {
        status: 400,
        statusText: `Unsupported chain: ${chain}`,
      });
  }

  return NextResponse.json(address);
  //return new Response(JSON.stringify(address));
}
