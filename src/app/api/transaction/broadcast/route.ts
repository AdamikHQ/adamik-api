import { NextRequest, NextResponse } from "next/server";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { BroadcastStatus, TransactionWrapper } from "~/app/model/types_WIP";
import { requestSchema } from "./schema";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    return handleRequestValidationError(e);
  }

  let transaction: TransactionWrapper = {
    plain: stringToBigint(body.transaction.plain),
    encoded: body.transaction.encoded,
    signature: body.transaction.signature,
    status: { errors: [], warnings: [] },
  };

  const chainId = transaction.plain.chainId;

  const service = getService(chainId);
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
