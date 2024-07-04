import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/patch";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, account_id } = requestSchema.parse(await request.json());

  const service = getService(chainId);

  const isAddressValid = await service.validateAddress(account_id);

  if (!isAddressValid) {
    return NextResponse.json(
      { message: "Address is invalid" },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }
  const state = await service.getAddressState(origin);

  return NextResponse.json(state);
}

module.exports = apiHandler({
  POST
});
