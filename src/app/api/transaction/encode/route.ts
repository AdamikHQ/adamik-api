import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsedRequest = requestSchema.safeParse(await request.json());
  if (parsedRequest.success === false) {
    return handleRequestValidationError(parsedRequest.error);
  }
  const body = parsedRequest.data;
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
