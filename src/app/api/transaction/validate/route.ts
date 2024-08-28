import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { Transaction, TransactionData } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await requestSchema.parseAsync(await request.json());

  const transactionData: TransactionData = stringToBigint(body.transaction);

  const service = getService(transactionData.chainId);

  let transaction: Transaction = {
    data: transactionData,
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
