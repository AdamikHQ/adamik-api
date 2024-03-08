import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { services } from "~/app/families/services";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (validateAddress)
  const { chainId, address } = await request.json();

  if (!chainId) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Field `chainId` is required",
    });
  }

  if (!address) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Field `address` is required",
    });
  }

  const service = services.get(chainId);
  if (!service) {
    return new NextResponse(null, {
      status: 501,
      statusText: `Unsupported chain: ${chainId}`,
    });
  }

  const isAddressValid = await service.validateAddress(chainId, address);
  if (!isAddressValid) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Address is invalid",
    });
  }

  const state = await service.getAddressState(chainId, address);

  return NextResponse.json(state);
}
