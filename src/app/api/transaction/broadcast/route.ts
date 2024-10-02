import { getService } from "~/app/families/services";
import { Transaction } from "~/app/model/types_WIP";
import { AdamikResponse, apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(
  async (body) => {
    let transaction: Transaction = {
      data: body.transaction.data,
      encoded: body.transaction.encoded,
      signature: body.transaction.signature,
    };

    const chainId = transaction.data.chainId;
    const service = getService(chainId);

    const broadcastPayload = await service.encodeTransactionToBroadcast(transaction);
    const broadcastStatus = await service.broadcastTransaction(broadcastPayload);

    return AdamikResponse.json({ hash: broadcastStatus.hash, transaction });
  },
  {
    requestSchema,
    responseSchema,
  }
);
