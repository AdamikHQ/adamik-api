import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/patch";
import { requestSchema } from "./schema";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, addresses } = requestSchema.parse(await request.json());

  const service = getService(chainId);

  const invalidAddresses: string[] = [];
  for (const address of addresses) {
    const isAddressValid = await service.validateAddress(address);
    if (!isAddressValid) {
      invalidAddresses.push(address);
    }
  }

  if (invalidAddresses.length) {
    return NextResponse.json(
      { message: `Invalid addresses for chainId ${chainId}: [${invalidAddresses.toString()}]` },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }

  try {
    const state = await service.getAccountState({ addresses });

    return NextResponse.json(state);
  } catch (e: any) {
    // FIXME Weak error management...
    // We should maybe propagate a status instead, same as for transaction/encode
    return NextResponse.json(
      { message: e.toString() },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }
}

module.exports = apiHandler({
  POST,
});
