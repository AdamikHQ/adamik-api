import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getService } from "~/app/families/services";
import { ApiRequestFilters } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/bigintPatch";
import { requestSchema } from "./schema";

type Params = z.infer<typeof requestSchema>;

export async function GET(request: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId, transactionId } = requestSchema.parse(context.params);

  // Parse supported query params like : /.../...?include=parsed,raw
  // to build an ApiRequestFilters object like : { parsed?: true, raw?: true }
  const filters: ApiRequestFilters = {};
  const params = request.nextUrl.searchParams;
  params
    .get("include")
    ?.split(",")
    .filter(Boolean)
    .forEach((param) => {
      filters[param] = true;
    });

  const service = getService(chainId);

  const transaction = await service.getTransaction(transactionId);
  if (!transaction) {
    return NextResponse.json(
      { message: `Transaction ${transactionId} not found for chainId ${chainId}` },
      { status: 400, statusText: `Transaction not found` }
    );
  }

  // Apply filters
  if (filters.parsed && !transaction.parsed) {
    return NextResponse.json(
      { message: `Parsing currently not supported for transaction ${transactionId}` },
      { status: 500, statusText: `Transaction not supported` }
    );
  }

  // Each field is returned if (explicitely demanded OR nothing specific demanded)
  const includeParsed = filters.parsed || !Object.keys(filters).length;
  const includeRaw = filters.raw || !Object.keys(filters).length;
  return NextResponse.json({
    // Syntax trick to conditionally include fields
    ...(includeParsed && { parsed: transaction.parsed }),
    ...(includeRaw && { raw: transaction.raw }),
  });
}

module.exports = apiHandler({
  GET,
});
