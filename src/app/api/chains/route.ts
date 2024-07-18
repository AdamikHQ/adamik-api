import { NextResponse } from "next/server";
import { CHAINS } from "~/app/config/chains";
import { deepBigintOrNumToString } from "~/app/tools/convertors/deepBigintToString";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { responseSchema } from "./schema";

export const GET = apiHandlerWrapper(
  async () => {
    return NextResponse.json({ chains: deepBigintOrNumToString(CHAINS) });
  },
  {
    responseSchema,
  }
);
