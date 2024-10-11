import { CHAINS } from "~/app/config/chains";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { responseSchema } from "./schema";

export const GET = apiHandler(
  {
    responseSchema,
  },
  async () => {
    return { chains: CHAINS };
  }
);
