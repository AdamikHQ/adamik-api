import { getService } from "~/app/config/services";
import { Status, Transaction, TransactionData } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    requestSchema,
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
