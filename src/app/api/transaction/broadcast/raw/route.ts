import { getService } from "~/app/families/services";
import { apiHandler, statusFromMessage } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    requestSchema,
    responseSchema,
  },
  async ({ body }) => {
    const { chainId, payload: broadcastPayload } = body;

    const service = getService(chainId);

    // FIXME Rework error handling for broadcast
    try {
      const broadcastStatus = await service.broadcastTransaction(broadcastPayload);
      return broadcastStatus;
    } catch {
      console.warn(`/!\\ Raw transaction broadcast failed for payload '${broadcastPayload}'`);
      throw new InvalidTransactionError(statusFromMessage("Transaction broadcast failed"));
    }
  }
);
