import { NextRequest, NextResponse } from "next/server";
import { Transaction } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { apiHandler } from "~/app/tools/handlers/apiHandler";

async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await requestSchema.parseAsync(await request.json());

  const plainTransaction: Transaction["data"] = stringToBigint(body.transaction.data);

  const service = getService(plainTransaction.chainId);

  let transaction: Transaction = {
    data: plainTransaction,
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
  POST,
});
