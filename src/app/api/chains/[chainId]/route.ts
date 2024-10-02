import { CHAINS } from "~/app/config/chains";
import { AdamikResponse, apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { pathParamsSchema, responseSchema } from "./schema";

export const GET = apiHandlerWrapper(
  async (_, { chainId }) => {
    const chain = CHAINS[chainId];

    return AdamikResponse.json(chain);
  },
  {
    responseSchema,
    pathParamsSchema,
  }
);
