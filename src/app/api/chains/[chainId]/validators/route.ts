import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { isStakingService } from "~/app/model/service";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/bigintPatch";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const { chainId, pagination } = requestSchema.parse(await request.json());

  const service = getService(chainId);

  if (!isStakingService(service)) {
    return NextResponse.json(
      { message: `Staking is not supported for chainId ${chainId}` },
      { status: 400, statusText: "Unsupported feature" }
    );
  }

  const validators = pagination ? await service.getValidators(pagination) : await service.getValidators();

  const validatorsResponse = {
    chainId,
    validators,
  };

  return NextResponse.json(validatorsResponse);
}

module.exports = apiHandler({
  POST,
});
