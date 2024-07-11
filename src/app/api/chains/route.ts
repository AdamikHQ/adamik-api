import { NextResponse } from "next/server";
import { CHAINS_PUBLIC } from "~/app/config/chains";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { responseSchema } from "./schema";

export const GET = apiHandlerWrapper(async () => {
  return NextResponse.json({ chains: CHAINS_PUBLIC });
}, {
  responseSchema
});
