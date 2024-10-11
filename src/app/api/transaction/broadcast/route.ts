import { getService } from "~/app/families/services";
import { Transaction } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
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
    const broadcastStatus = await service.broadcastTransaction(broadcastPayload);

    return { hash: broadcastStatus.hash, transaction };
  }
);
