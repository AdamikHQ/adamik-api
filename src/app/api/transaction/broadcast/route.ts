import { NextRequest, NextResponse } from "next/server";
import { BroadcastStatus, Transaction } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { getService } from "~/app/families/services";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { requestSchema } from "./schema";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsedRequest = requestSchema.safeParse(await request.json());

  if (parsedRequest.success === false) {
    return handleRequestValidationError(parsedRequest.error);
  }

  const body = parsedRequest.data;
  let transaction: Transaction = {
    ...stringToBigint(body.transaction),
    status: { errors: [], warnings: [] },
  };

  const chainId = transaction.plain.chainId;
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
