import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { SERVICES } from "~/app/families/services";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    return handleRequestValidationError(e);
  }

  const transaction: PlainTransaction = stringToBigint(body.transaction.plain);

  const { chainId } = transaction;

  const service = SERVICES.get(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
  }

  const status = await service.prevalidateTransaction(transaction);

  return NextResponse.json(status);
}
