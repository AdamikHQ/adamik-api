import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { apiHandler } from "~/app/tools/handlers/apiHandler";

async function POST(request: NextRequest): Promise<NextResponse> {
  const body = requestSchema.parse(await request.json());

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
}

module.exports = apiHandler({
  POST
});
