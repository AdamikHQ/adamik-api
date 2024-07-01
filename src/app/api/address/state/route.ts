import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/patch";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, origin } = requestSchema.parse(await request.json());

  const service = getService(chainId);

  if ('address' in origin) {
    const isAddressValid = await service.validateAddress(origin.address);

    if (!isAddressValid) {
      return NextResponse.json(
        { message: "Address is invalid" },
        { status: 400, statusText: "Invalid or missing fields" }
      );
    }
  } // else xpub doesnt need to be validated, zod already validated it with a regex
  const state = await service.getAddressState(origin);

  return NextResponse.json(state);
}

module.exports = apiHandler({
  POST
});
