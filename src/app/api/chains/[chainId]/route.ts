import { NextResponse } from "next/server";
import { CHAINS } from "~/app/config/chains";
import { deepBigintOrNumToString } from "~/app/tools/convertors/deepBigintToString";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { pathParamsSchema, responseSchema } from "./schema";

export const GET = apiHandlerWrapper(
  async (_, { chainId }) => {
    const chain = CHAINS[chainId];

    return NextResponse.json(deepBigintOrNumToString(chain)); // FIXME: backends should be filtered out
  },
  {
    responseSchema,
    pathParamsSchema,
  }
);
