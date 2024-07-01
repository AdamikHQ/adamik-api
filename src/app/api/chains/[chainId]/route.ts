import { NextRequest, NextResponse } from "next/server";
import { CHAINS_PUBLIC } from "~/app/config/chains";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { requestSchema } from "./schema";
import { z } from "zod";

type Params = z.infer<typeof requestSchema>;

async function GET(_: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId } = requestSchema.parse(context.params);

  const chain = CHAINS_PUBLIC[chainId];

  return NextResponse.json(chain);
}

module.exports = apiHandler({
  GET
});
