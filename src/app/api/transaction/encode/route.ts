import { getService } from "~/app/families/services";
import { Transaction, TransactionData } from "~/app/model/types_WIP";
import { apiHandler, type AdamikStatus } from "~/app/tools/handlers/apiHandler";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    requestSchema,
    responseSchema,
  },
  async ({ body }) => {
    const transactionData: TransactionData = body.transaction.data;

    const service = getService(transactionData.chainId);

    // Initialization of the full transaction that will be returned
    // NOTE It will traverse and be mutated by all the service functions below
    let transaction: Transaction = {
      data: transactionData,
    };
    let status: AdamikStatus = { errors: [], warnings: [] };

    await service.prevalidateTransaction(transaction, status);
    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    await service.completeTransaction(transaction, status);
    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    await service.validateTransaction(transaction, status);
    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    await service.encodeTransactionToSign(transaction, status);

    if (status.errors.length) {
      throw new InvalidTransactionError(status);
    }

    return { transaction };
  }
);
