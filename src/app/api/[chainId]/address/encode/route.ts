import { getService } from "~/app/config/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { pathParamsSchema, requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    pathParamsSchema,
    requestSchema,
    responseSchema,
  },
  async ({ pathParams, body }) => {
    const { chainId } = pathParams;
    const { pubkey } = body;

    const service = getService(chainId);

    const addresses = await service.pubkeyToAddresses(pubkey);

    return { chainId, pubkey, addresses };
  }
);
