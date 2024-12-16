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
    const { address } = body;

    const service = getService(chainId);

    const isValid = await service.validateAddress(address);

    return {
      chainId,
      valid: isValid,
    };
  }
);
