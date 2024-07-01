import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { requestSchema } from "./schema";
import { apiHandler } from "~/app/tools/handlers/apiHandler";

async function POST(request: NextRequest): Promise<NextResponse> {
  const body = requestSchema.parse(await request.json());

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
    return NextResponse.json({ transaction }, { status: 400, statusText: `Invalid transaction` });
  }

  await service.completeTransaction(transaction);
  if (transaction.status.errors.length) {
    return NextResponse.json({ transaction }, { status: 400, statusText: `Invalid transaction` });
  }

  await service.validateTransaction(transaction);
  if (transaction.status.errors.length) {
    return NextResponse.json({ transaction }, { status: 400, statusText: `Invalid transaction` });
  }

  await service.encodeTransactionToSign(transaction);

  if (transaction.status.errors.length) {
    return NextResponse.json({ transaction }, { status: 400, statusText: `Invalid transaction` });
  } else {
    return NextResponse.json({ transaction });
  }
}

module.exports = apiHandler({
  POST
});
