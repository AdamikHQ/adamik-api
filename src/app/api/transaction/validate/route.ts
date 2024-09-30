import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { Transaction, TransactionData } from "~/app/model/types_WIP";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(
  async (body) => {
    const transactionData: TransactionData = stringToBigint(body.transaction.data);

    const service = getService(transactionData.chainId);

    let transaction: Transaction = {
      data: transactionData,
      status: { errors: [], warnings: [] },
    };

    await service.prevalidateTransaction(transaction);

    let responseBody = {
      transaction: {
        status: transaction.status,
      },
    };
    if (transaction.status.errors.length) {
      return NextResponse.json(responseBody, { status: 400, statusText: `Invalid transaction` });
    }
    return NextResponse.json(responseBody);
  },
  {
    requestSchema,
    responseSchema,
  }
);
