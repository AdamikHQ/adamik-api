import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { BroadcastStatus, Transaction } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { requestSchema } from "./schema";

async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await requestSchema.parseAsync(await request.json());

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
    return NextResponse.json({ error: transaction.status.errors[0] } as BroadcastStatus, {
      status: 400,
      statusText: `Invalid transaction`,
    });
  }

  const broadcastStatus = await service.broadcastTransaction(broadcastPayload);

  if (broadcastStatus.error) {
    return NextResponse.json(broadcastStatus, { status: 400, statusText: `Invalid transaction` });
  } else {
    return NextResponse.json(broadcastStatus);
  }
}

module.exports = apiHandler({
  POST,
});
