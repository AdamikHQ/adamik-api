import { getService } from "~/app/families/services";
import { AdamikResponse, apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(
  async ({ chainId, pubkey }) => {
    const service = getService(chainId);

    const address = await service.pubkeyToAddresses(pubkey);

    return AdamikResponse.json(address);
  },
  {
    requestSchema,
    responseSchema,
  }
);
