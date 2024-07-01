import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { isMultiBalancesService } from "~/app/model/service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, origin } = requestSchema.parse(await request.json());

  const service = getService(chainId);
  if (!service || !isMultiBalancesService(service)) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  // TODO: move origin as parameter of getAddressesState
  if ('addresses' in origin) {
    for (const address of origin.addresses) {
      const isAddressValid = await service.validateAddress(address);
      if (!isAddressValid) {
        return NextResponse.json(
          { message: `Address ${address} is invalid` },
          { status: 400, statusText: "Invalid or missing fields" }
        );
      }
    }

    const state = await service.getAddressesState(origin.addresses);

    return NextResponse.json(state);
  }
  return NextResponse.json({});
}
