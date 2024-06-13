import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { SERVICES } from "~/app/families/services";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    handleRequestValidationError(e);
  }

  const { chainId, address } = body;

  const service = SERVICES.get(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  const isAddressValid = await service.validateAddress(address);
  if (!isAddressValid) {
    return NextResponse.json(
      { message: "Address is invalid" },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }

  const state = await service.getAddressState(address);

  return NextResponse.json(state);
}
