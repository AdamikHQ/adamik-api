import { getService } from "~/app/config/services";
import { apiHandler, statusFromMessage } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    pathParamsSchema,
    requestSchema,
    responseSchema,
  },
  async ({ pathParams, body }) => {
    const { chainId } = pathParams;
    const { payload: broadcastPayload } = body;

    const service = getService(chainId);

    const transactionHash = await (async () => {
      try {
        return await service.broadcastTransaction(broadcastPayload);
      } catch (error) {
        console.warn("/!\\ Transaction broadcast failed for transaction:", broadcastPayload);
        console.warn("/!\\ Error is:", error);
        throw new InvalidTransactionError(statusFromMessage("Transaction broadcast failed"));
      }
    })();

    return { chainId, hash: transactionHash };
  }
);
