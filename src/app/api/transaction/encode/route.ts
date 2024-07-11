import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { deepBigintToString } from "~/app/tools/convertors/deepBigintToString";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { errorResponseSchema, requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(async (body) => {
  const plainTransaction: PlainTransaction = stringToBigint(body.transaction.plain);

  const service = getService(plainTransaction.chainId);

  // Initialization of the full transaction that will be returned
  // NOTE It will traverse and be mutated by all the service functions below
  let transaction: Transaction = {
    plain: plainTransaction,
    status: { errors: [], warnings: [] },
  };

  await service.prevalidateTransaction(transaction);
  if (transaction.status.errors.length) {
    return NextResponse.json({ transaction: deepBigintToString(transaction) }, { status: 400, statusText: `Invalid transaction` });
  }

  await service.completeTransaction(transaction);
  if (transaction.status.errors.length) {
    return NextResponse.json({ transaction: deepBigintToString(transaction) }, { status: 400, statusText: `Invalid transaction` });
  }

  await service.validateTransaction(transaction);
  if (transaction.status.errors.length) {
    return NextResponse.json({ transaction: deepBigintToString(transaction) }, { status: 400, statusText: `Invalid transaction` });
  }

  await service.encodeTransactionToSign(transaction);

  if (transaction.status.errors.length) {
    return NextResponse.json({ transaction: deepBigintToString(transaction) }, { status: 400, statusText: `Invalid transaction` });
  } else {
    return NextResponse.json({ transaction: deepBigintToString(transaction) });
  }
}, {
  requestSchema,
  // composite responseSchema to allow support of potentialy undefined `encoded` field in case of 400 error
  // TODO: find a way to simplify this, maybe with a better schema directly using zod-openapi?
  // That would allow for a check of the posible status codes in the response (making sure our code behavior is always updating the doc)
  responseSchema: responseSchema.or(errorResponseSchema)
});
