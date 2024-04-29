import { NextRequest, NextResponse } from "next/server";
import { Transaction } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { services } from "~/app/families/services";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import { requestSchema } from "./schema";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    return handleRequestValidationError(e);
  }

  const transaction: Transaction = stringToBigint(body.transaction);

  const {
    signature,
    plain: { chainId },
  } = transaction;

  const service = services.get(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  const signedTransaction = await service.encodeTransactionToBroadcast(chainId, transaction);

  const broadcastStatus = await service.broadcastTransaction(chainId, signedTransaction);

  return NextResponse.json(broadcastStatus);
}
