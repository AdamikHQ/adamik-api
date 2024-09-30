import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, pubkey } = requestSchema.parse(await request.json());

  const service = getService(chainId);

  try {
    const addresses = await service.pubkeyToAddresses(pubkey);
    return NextResponse.json({ chainId, pubkey, addresses });
  } catch (e: any) {
    return NextResponse.json({ message: e.toString() }, { status: 500, statusText: "Internal error" });
  }
}

module.exports = apiHandler({
  POST,
});
