import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { Transaction } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { services } from "~/app/chains/services";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (zod)
  const { transaction: payload } = await request.json();

  // FIXME Replace with JSON.parse
  const transaction: Transaction = stringToBigint(payload);

  if (!transaction.signature) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Field `signature` is required",
    });
  }

  const service = services.get(transaction.plain.chainId);
  if (!service) {
    return new NextResponse(null, {
      status: 501,
      statusText: `Unsupported chain: ${transaction.plain.chainId}`,
    });
  }

  const signedTransaction = await service.encodeTransactionToBroadcast(transaction);

  const broadcastStatus = await service.broadcastTransaction(signedTransaction);

  return NextResponse.json(broadcastStatus);
  //return new Response(JSON.stringify(broadcastStatus));
}
