import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { Transaction } from "~/app/model/types_WIP";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(
  async (body) => {
    // FIXME: use zod instead to convert string to bigint
    let transaction: Transaction = {
      data: stringToBigint(body.transaction.data),
      encoded: body.transaction.encoded,
      signature: body.transaction.signature,
      status: { errors: [], warnings: [] },
    };

    const chainId = transaction.data.chainId;
    const service = getService(chainId);

    const broadcastPayload = await service.encodeTransactionToBroadcast(transaction);
    if (transaction.status.errors.length) {
      return NextResponse.json(
        { error: { message: transaction.status.errors[0].message } },
        {
          status: 400,
          statusText: `Invalid transaction`,
        }
      );
    }

    const broadcastStatus = await service.broadcastTransaction(broadcastPayload);

    if ("error" in broadcastStatus) {
      return NextResponse.json(broadcastStatus, { status: 400, statusText: `Invalid transaction` });
    }
    return NextResponse.json(broadcastStatus);
  },
  {
    requestSchema,
    responseSchema,
  }
);
