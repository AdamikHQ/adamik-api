import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { apiHandler } from "~/app/tools/handlers/apiHandler";

async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, pubkey } = requestSchema.parse(await request.json());

  const service = getService(chainId);

  try {
    const address = await service.pubkeyToAddress(pubkey);

    return NextResponse.json(address);
  } catch (e: any) {
    return NextResponse.json({ message: e.toString() }, { status: 500, statusText: "Internal error" });
  }
}

module.exports = apiHandler({
  POST,
});
