import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { services } from "~/app/families/services";
import "~/app/patch";
import { getDataValidators } from "./schema";
import { ChainId } from "~/app/model/types_WIP";

type Params = {
  offset?: number;
  limit?: number;
  chainId: ChainId;
};
const VALIDATORS_LIMIT = 100;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;

  const offset = Number(searchParams.get("offset"));
  const limit = Number(searchParams.get("limit"));
  const chainId = searchParams.get("chainId") as ChainId;

  try {
    getDataValidators.parse({ offset: offset ?? undefined, limit: limit ?? undefined, chainId: chainId });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { message: "invalid request", errors: e.errors },
        { status: 400, statusText: "Invalid or missing fields" }
      );
    }
    throw e;
  }

  const service = services.get(chainId);
  if (!service) {
    return new NextResponse(null, {
      status: 501,
      statusText: `Unsupported chain: ${chainId}`,
    });
  }

  if (service.getValidators === undefined) {
    return NextResponse.json(
      { message: "Validator services is not available" },
      { status: 404, statusText: "Invalid chainId" }
    );
  }

  const validatorResponse = await service.getValidators(
    chainId,
    Number(offset) ?? 0,
    Number(limit) ?? VALIDATORS_LIMIT
  );

  return NextResponse.json(validatorResponse);
}
