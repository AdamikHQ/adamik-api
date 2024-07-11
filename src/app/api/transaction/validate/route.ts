import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(async (body) => {
  const plainTransaction: PlainTransaction = stringToBigint(body.transaction.plain);

  const service = getService(plainTransaction.chainId);

  let transaction: Transaction = {
    plain: plainTransaction,
    status: { errors: [], warnings: [] },
  };

  await service.prevalidateTransaction(transaction);

  if (transaction.status.errors.length) {
    return NextResponse.json(transaction.status, { status: 400, statusText: `Invalid transaction` });
  } else {
    return NextResponse.json(transaction.status);
  }
}, {
  requestSchema,
  responseSchema
});
