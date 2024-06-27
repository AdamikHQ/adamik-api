import { NextRequest, NextResponse } from "next/server";
import { Transaction, TransactionWrapper } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { getService } from "~/app/families/services";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    let transactionWrapper = requestSchema.parse(body);
    const plainTransaction = stringToBigint(transactionWrapper.transaction.plain);

    const service = getService(plainTransaction.chainId);
    if (!service) {
      return NextResponse.json(
        { message: `Chain ID ${plainTransaction.chainId} is not supported` },
        { status: 400, statusText: `Unsupported chainId` }
      );
    }

    let transaction: TransactionWrapper = {
      plain: plainTransaction,
      status: { errors: [], warnings: [] },
    };

    await service.prevalidateTransaction(transaction);

    if (transaction.status.errors.length) {
      return NextResponse.json(transaction.status, { status: 400, statusText: `Invalid transaction` });
    } else {
      return NextResponse.json(transaction.status);
    }
  } catch (e) {
    return handleRequestValidationError(e);
  }
}
