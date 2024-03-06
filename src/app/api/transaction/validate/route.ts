import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, TransactionStatus } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { services } from "~/app/families/services";

// TODO WIP

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (zod)
  const { transaction: payload } = await request.json();

  // FIXME Replace with JSON.parse
  const transaction: PlainTransaction = stringToBigint(payload);

  const service = services.get(transaction.chainId);
  if (!service) {
    return new NextResponse(null, {
      status: 501,
      statusText: `Unsupported chain: ${transaction.chainId}`,
    });
  }

  const status = await service.validateTransactionIntent(transaction);

  return NextResponse.json(status);
  //return new Response(JSON.stringify(encodedTransaction));
}
