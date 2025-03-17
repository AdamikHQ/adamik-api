import { z } from "zod";
import { getService } from "~/app/config/services";
import { Status, Transaction, TransactionData } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
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
    requestSchema: patchedRequestSchema,
    pathParamsSchema,
    responseSchema,
  },
  async ({ pathParams, body }) => {
    const { chainId } = pathParams;

    const transactionData: TransactionData = body.transaction.data;

    const service = getService(chainId);

    let transaction: Transaction = {
      data: transactionData,
    };
    let status: Status = { errors: [], warnings: [] };

    await service.prevalidateTransaction({ transaction, status });
    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    return { chainId, status };
  }
);
