import { CHAINS } from "~/app/config/chains";
import { AdamikResponse, apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { responseSchema } from "./schema";

export const GET = apiHandlerWrapper(
  async () => {
    return AdamikResponse.json({ chains: CHAINS });
  },
  {
    responseSchema,
  }
);
