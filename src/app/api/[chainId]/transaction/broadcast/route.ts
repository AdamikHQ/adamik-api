import { z } from "zod";
import { getService } from "~/app/config/services";
import { Transaction } from "~/app/model/types_WIP";
import { apiHandler, statusFromMessage } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError, UserInputError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, requestSchema, responseSchema } from "./schema";

// FIXME Temporary hack to postpone refactoring the internal model for now.
// These fields have initially been defined as non-optional in the internal model,
// i.e: they were expected to be always present in ALL types of transactions.
// But we have since added support for some transactions where they are NOT mandatory,
// so we just need to change them as optional in the internal model but this needs adaptation a bit everywhere
const patchedRequestSchema = requestSchema.and(
  z.object({
    transaction: z.object({
      data: z.object({
        senderAddress: z.string().default(""),
        recipientAddress: z.string().default(""),
      }),
    }),
  })
);

export const POST = apiHandler(
  {
    pathParamsSchema,
    requestSchema: patchedRequestSchema,
    responseSchema,
  },
  async ({ pathParams, body }) => {
    const { chainId } = pathParams;

    const transaction: Transaction = body.transaction;

    const service = getService(chainId);

    const broadcastPayload = await (async () => {
      try {
        return await service.encodeTransactionToBroadcast({ signedTransaction: transaction });
      } catch (error) {
        console.warn(`/!\\ Encode to broadcast failed for transaction:`, transaction);
        console.warn("/!\\ Error is:", error);
        throw new UserInputError(
          `Failed to encode transaction for broadcast, verify that signature is valid`
        );
      }
    })();

    const transactionHash = await (async () => {
      try {
        return await service.broadcastTransaction(broadcastPayload);
      } catch (error) {
        console.warn("/!\\ Transaction broadcast failed for transaction:", transaction);
        console.warn("/!\\ Error is:", JSON.stringify(error));

        const errorMessage =
          error instanceof UserInputError
            ? `Transaction broadcast failed: ${error.message})`
            : "Transaction broadcast failed";

        throw new InvalidTransactionError(statusFromMessage(errorMessage));
      }
    })();

    return { chainId, transaction, hash: transactionHash };
  }
);
