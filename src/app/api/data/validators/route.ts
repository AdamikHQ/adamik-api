import { NextRequest, NextResponse } from "next/server";
import { services } from "~/app/families/services";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";

// TODO Make sure to document this implicit limit in the doc / swagger description
// We could also add something in the response to help user know what to fetch next (next limit, next URL...)
const VALIDATORS_LIMIT = 100;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    return handleRequestValidationError(e);
  }

  const { chainId, limit, offset } = body;

  const service = services.get(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  if (!service.getValidators) {
    return NextResponse.json(
      { message: `No validators for chain ID ${chainId}` },
      { status: 400, statusText: "Invalid chainId" }
    );
  }

  const validatorResponse = await service.getValidators(chainId, offset ?? 0, limit ?? VALIDATORS_LIMIT);

  return NextResponse.json(validatorResponse);
}
