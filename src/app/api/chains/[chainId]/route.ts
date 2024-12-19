import { CHAINS } from "~/app/config/chains";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { pathParamsSchema, responseSchema } from "./schema";

export const GET = apiHandler(
  {
    pathParamsSchema,
    responseSchema,
  },
  async ({ pathParams }) => ({
    chain: CHAINS[pathParams.chainId],
  })
);
