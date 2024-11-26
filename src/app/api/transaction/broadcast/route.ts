import { getService } from "~/app/config/services";
import { Transaction } from "~/app/model/types_WIP";
import { apiHandler, statusFromMessage } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
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

    const broadcastPayload = await (async () => {
      try {
        return await service.encodeTransactionToBroadcast({ signedTransaction: transaction });
      } catch (error) {
        console.warn(`/!\\ Encode to broadcast failed for transaction:`, transaction);
        console.warn("Error is:", error);
        throw new UserInputError(
          `Failed to encode transaction for broadcast, verify that signature is valid`
        );
      }
    })();

    const broadcastStatus = await (async () => {
      try {
        return await service.broadcastTransaction(broadcastPayload);
      } catch (error) {
        console.warn("/!\\ Transaction broadcast failed for transaction:", transaction);
        console.warn("Error is:", error);
        throw new InvalidTransactionError(statusFromMessage("Transaction broadcast failed"));
      }
    })();

    return { hash: broadcastStatus.hash, transaction };
  }
);
