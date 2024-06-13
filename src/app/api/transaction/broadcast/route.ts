import { NextRequest, NextResponse } from "next/server";
import { BroadcastStatus, Transaction } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { SERVICES } from "~/app/families/services";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { requestSchema } from "./schema";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    return handleRequestValidationError(e);
  }

  const transaction: Transaction = {
    ...stringToBigint(body.transaction),
    status: { errors: [], warnings: [] },
  };

  const chainId = transaction.plain.chainId;

  const service = SERVICES.get(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

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
