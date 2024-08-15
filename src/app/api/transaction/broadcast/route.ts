import { NextRequest, NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { BroadcastStatus, TransactionWrapper } from "~/app/model/types_WIP";
import { requestSchema } from "./schema";
import { apiHandler } from "~/app/tools/handlers/apiHandler";

async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await requestSchema.parseAsync(await request.json());

  let transaction: TransactionWrapper = {
    data: stringToBigint(body.transaction.data),
    // FIXME: better schema for encoded required
    encoded: body.transaction.encoded as any,
    signature: body.transaction.signature,
    status: { errors: [], warnings: [] },
  };

  const chainId = transaction.data.chainId;
  const service = getService(chainId);

  const signedTransaction = await service.encodeTransactionToBroadcast(transaction);
  if (transaction.status.errors.length) {
    return NextResponse.json({ error: transaction.status.errors[0] } as BroadcastStatus, {
      status: 400,
      statusText: `Invalid transaction`,
    });
  }

  const broadcastStatus = await service.broadcastTransaction(signedTransaction);

  if (broadcastStatus.error) {
    return NextResponse.json(broadcastStatus, { status: 400, statusText: `Invalid transaction` });
  } else {
    return NextResponse.json(broadcastStatus);
  }
}

module.exports = apiHandler({
  POST,
});
