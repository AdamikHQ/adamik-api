import { getService } from "~/app/config/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    requestSchema,
    responseSchema,
  },
  async ({ body }) => {
    const { chainId, address } = body;

    const service = getService(chainId);

    const isValid = await service.validateAddress(address);

    return isValid;
  }
);
