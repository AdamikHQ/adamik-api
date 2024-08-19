import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { requestSchema } from "./schema";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { Transaction } from "~/app/model/types_WIP";

async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await requestSchema.parseAsync(await request.json());

  const transactionData = stringToBigint(body.transaction.data);

  const service = getService(transactionData.chainId);

  // Initialization of the full transaction that will be returned
  // NOTE It will traverse and be mutated by all the service functions below
  let transaction: Transaction = {
    data: transactionData,
    status: { errors: [], warnings: [] },
  };

  await service.prevalidateTransaction(transaction);
  if (transaction.status.errors.length) {
    return NextResponse.json({ transaction }, { status: 400, statusText: `Invalid transaction` });
  }

  let completeTransaction = await service.completeTransaction(transaction);
  if (completeTransaction.status.errors.length) {
    return NextResponse.json({ completeTransaction }, { status: 400, statusText: `Invalid transaction` });
  }

  await service.validateTransaction(completeTransaction);
  if (completeTransaction.status.errors.length) {
    return NextResponse.json({ completeTransaction }, { status: 400, statusText: `Invalid transaction` });
  }

  await service.encodeTransactionToSign(completeTransaction);

  if (completeTransaction.status.errors.length) {
    return NextResponse.json({ completeTransaction }, { status: 400, statusText: `Invalid transaction` });
  } else {
    return NextResponse.json({ completeTransaction });
  }
}

module.exports = apiHandler({
  POST,
});
