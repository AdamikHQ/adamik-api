import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parseResult = requestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return handleRequestValidationError(parseResult.error);
  }
  const body = parseResult.data;
  const service = getService(body.chainId);
  const isAddressValid = await service.validateAddress(body.address);

  if (!isAddressValid) {
    return NextResponse.json(
      { message: "Address format is invalid" },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }

  const state = await service.getAddressState(body.address);

  return NextResponse.json(state);

}
