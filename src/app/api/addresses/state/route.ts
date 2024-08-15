import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { isMultiBalancesService } from "~/app/model/service";
import { apiHandler } from "~/app/tools/handlers/apiHandler";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, addresses } = requestSchema.parse(await request.json());

  const service = getService(chainId);
  if (!isMultiBalancesService(service)) {
    return NextResponse.json(
      { message: `Endpoint /addresses not available for Chain ID ${chainId}` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  for (const address of addresses) {
    const isAddressValid = await service.validateAddress(address);
    if (!isAddressValid) {
      return NextResponse.json(
        { message: `Address ${address} is invalid` },
        { status: 400, statusText: "Invalid or missing fields" }
      );
    }
  }

  const state = await service.getAddressesState(addresses);

  return NextResponse.json(state);
}

module.exports = apiHandler({
  POST
});
