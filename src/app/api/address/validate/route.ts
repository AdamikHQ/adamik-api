import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, address } = requestSchema.parse(await request.json());

  const service = getService(chainId);

  const isValid = await service.validateAddress(address);

  return NextResponse.json(isValid);
}

module.exports = apiHandler({
  POST
});
