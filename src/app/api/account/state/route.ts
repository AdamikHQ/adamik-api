import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/bigintPatch";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, accountId } = requestSchema.parse(await request.json());

  const service = getService(chainId);

  const isAccountIdValid = await service.validateAddress(accountId);

  if (!isAccountIdValid) {
    return NextResponse.json(
      { message: `Invalid accountId ${accountId} for chainId ${chainId}` },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }

  try {
    const state = await service.getAccountState(accountId);

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
