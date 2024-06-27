import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { isStakingService } from "~/app/model/service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    return handleRequestValidationError(e);
  }

  const { chainId, pagination } = body;

  const service = getService(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  if (!isStakingService(service)) {
    return NextResponse.json(
      { message: `Staking is not supported for chain ID ${chainId}` },
      { status: 400, statusText: "Invalid chainId" }
    );
  }

  const validators = pagination ? await service.getValidators(pagination) : await service.getValidators();

  return NextResponse.json({ validators });
}
