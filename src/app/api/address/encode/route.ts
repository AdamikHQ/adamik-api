import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { requestSchema } from "./schema";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    return handleRequestValidationError(e);
  }

  const { chainId, pubkey } = body;

  const service = getService(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  const address = await service.pubkeyToAddress(pubkey);

  return NextResponse.json(address);
}
