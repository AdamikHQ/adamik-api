import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { apiHandler } from "~/app/api/handlers/apiHandler";

async function POST(request: NextRequest): Promise<NextResponse> {
  const body = requestSchema.parse(await request.json());
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

module.exports = apiHandler({
  POST
});
