import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { requestSchema } from "./schema";
import { z } from "zod";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsedRequest = requestSchema.safeParse(await request.json());

  if (parsedRequest.success === false) {
    return handleRequestValidationError(parsedRequest.error);
  }
  const { chainId, address } = parsedRequest.data;

  const service = getService(chainId);

  const isValid = await service.validateAddress(address);

  return NextResponse.json(isValid);
}
