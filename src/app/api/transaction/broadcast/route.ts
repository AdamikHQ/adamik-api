import { getService } from "~/app/config/services";
import { Transaction } from "~/app/model/types_WIP";
import { apiHandler, statusFromMessage } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    requestSchema,
    responseSchema,
  },
  async ({ body }) => {
    const transaction: Transaction = body.transaction;

    const chainId = transaction.data.chainId;
    const service = getService(chainId);

    const broadcastPayload = await service.encodeTransactionToBroadcast({ signedTransaction: transaction });

    // FIXME Rework error handling for broadcast
    try {
      const broadcastStatus = await service.broadcastTransaction(broadcastPayload);
      return { hash: broadcastStatus.hash, transaction };
    } catch {
      console.warn(`/!\\ Transaction broadcast failed for transaction '${transaction}'`);
      throw new InvalidTransactionError(statusFromMessage("Transaction broadcast failed"));
    }
  }
);
