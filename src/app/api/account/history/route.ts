import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/bigintPatch";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, accountId } = requestSchema.parse(await request.json());

  const searchParams = request.nextUrl.searchParams;
  const fromTimestamp = z
    .number()
    .optional()
    .catch(undefined)
    .parse(Number(searchParams.get("from_timestamp")));
  const toTimestamp = z
    .number()
    .optional()
    .catch(undefined)
    .parse(Number(searchParams.get("to_timestamp")));

  const service = getService(chainId);

  const isAccountIdValid = await service.validateAddress(accountId);

  if (!isAccountIdValid) {
    return NextResponse.json(
      { message: `Invalid accountId ${accountId} for chainId ${chainId}` },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }

  try {
    const history = await service.getAccountHistory(accountId, { fromTimestamp, toTimestamp });

    return NextResponse.json(history);
  } catch (e: any) {
    // FIXME Weak error management...
    // We should maybe propagate a status instead, same as for transaction/encode
    return NextResponse.json(
      { message: e.toString() },
      { status: 400, statusText: "Error while getting account history" }
    );
  }
}

module.exports = apiHandler({
  POST,
});
