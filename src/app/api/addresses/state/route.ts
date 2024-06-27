import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { isMultiBalancesService } from "~/app/model/service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    handleRequestValidationError(e);
  }

  const { chainId, addresses } = body;

  const service = getService(chainId);
  if (!service || !isMultiBalancesService(service)) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
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
