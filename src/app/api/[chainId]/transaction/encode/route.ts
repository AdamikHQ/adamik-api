import { getService } from "~/app/config/services";
import { Status, Transaction, TransactionData } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
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

    const transactionData: TransactionData = body.transaction.data;

    const service = getService(chainId);

    // Initialization of the full transaction and status that will be returned
    // NOTE They will traverse and be mutated by all the service functions below
    let transaction: Transaction = { data: transactionData };
    let status: Status = { errors: [], warnings: [] };

    await service.prevalidateTransaction({ transaction, status });
    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    await service.completeTransaction({ transaction, status });
    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    await service.validateTransaction({ transaction, status });
    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    await service.encodeTransactionToSign({ transaction, status });
    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    return { chainId, transaction, status };
  }
);
