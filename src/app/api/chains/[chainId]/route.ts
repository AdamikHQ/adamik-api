import { NextResponse } from "next/server";
import { CHAINS_PUBLIC } from "~/app/config/chains";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { responseSchema, urlParamsSchema } from "./schema";

export const GET = apiHandlerWrapper(async (_, { chainId }) => {
  const chain = CHAINS_PUBLIC[chainId];

  return NextResponse.json(chain);
}, {
  responseSchema,
  urlParamsSchema,
});
