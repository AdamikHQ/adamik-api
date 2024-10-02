import { getService } from "~/app/families/services";
import { AdamikResponse, apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(
  async ({ chainId, address }) => {
    const service = getService(chainId);

    const isValid = await service.validateAddress(address);

    return AdamikResponse.json(isValid);
  },
  {
    requestSchema,
    responseSchema,
  }
);
