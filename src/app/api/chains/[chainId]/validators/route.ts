import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { getService } from "~/app/families/services";
import { isStakingService } from "~/app/model/service";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/bigintPatch";
import { requestSchema } from "./schema";

type Params = z.infer<typeof requestSchema>;

async function GET(request: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId } = requestSchema.parse(context.params);

  const searchParams = request.nextUrl.searchParams;
  const offset = z
    .number()
    .catch(0)
    .parse(Number(searchParams.get("offset")));
  const limit = z
    .number()
    .catch(0)
    .parse(Number(searchParams.get("limit")));

  const service = getService(chainId);

  if (!isStakingService(service)) {
    return NextResponse.json(
      { message: `Staking is not supported for chainId ${chainId}` },
      { status: 400, statusText: "Unsupported feature" }
    );
  }

  const validators = await service.getValidators({ offset, limit });

  const validatorsResponse = {
    chainId,
    validators,
  };

  return NextResponse.json(validatorsResponse);
}

module.exports = apiHandler({
  GET,
});
