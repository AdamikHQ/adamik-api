import { getService } from "~/app/config/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    requestSchema,
    responseSchema,
  },
  async ({ body }) => {
    const { chainId, pubkey } = body;
    const service = getService(chainId);

    const addresses = await service.pubkeyToAddresses(pubkey);

    return { chainId, pubkey, addresses };
  }
);
