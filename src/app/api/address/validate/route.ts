import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { services } from "~/app/families/services";

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

  const isValid = await service.validateAddress(chain.id, address);

  return NextResponse.json(isValid);
}
