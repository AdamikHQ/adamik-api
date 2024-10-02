import { getService } from "~/app/families/services";
import { Transaction, TransactionData } from "~/app/model/types_WIP";
import { AdamikResponse, apiHandlerWrapper, type AdamikStatus } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(
  async (body) => {
    const transactionData: TransactionData = body.transaction.data;

    const service = getService(transactionData.chainId);

    let transaction: Transaction = {
      data: transactionData,
    };
    let status: AdamikStatus = { errors: [], warnings: [] };

    await service.prevalidateTransaction(transaction, status);

    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }
    return AdamikResponse.json({ transaction, status });
  },
  {
    requestSchema,
    responseSchema,
  }
);
