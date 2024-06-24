import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { isStakingService } from "~/app/model/service";

// TODO Make sure to document this implicit limit in the doc / swagger description
// We could also add something in the response to help user know what to fetch next (next limit, next URL...)
const VALIDATORS_LIMIT = 100;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsedRequest = requestSchema.safeParse(await request.json());

  if (parsedRequest.success === false) {
    return handleRequestValidationError(parsedRequest.error);
  }

  const { chainId, limit, offset } = parsedRequest.data;

  const service = getService(chainId);

  if (!isStakingService(service)) {
    return NextResponse.json(
      { message: `Staking is not supported for chain ID ${chainId}` },
      { status: 400, statusText: "Invalid chainId" }
    );
  }

  const validatorResponse = await service.getValidators(offset ?? 0, limit ?? VALIDATORS_LIMIT);

  return NextResponse.json(validatorResponse);
}
