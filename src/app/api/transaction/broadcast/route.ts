import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { Transaction } from "~/app/model/types_WIP";
import { stringToBigint } from "~/app/model/serialization";
import { services } from "~/app/families/services";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (zod)
  const { transaction: payload } = await request.json();

  // FIXME Replace with JSON.parse
  const transaction: Transaction = stringToBigint(payload);

  const {
    signature,
    plain: { chainId },
  } = transaction;

  if (!signature) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Field `signature` is required",
    });
  }

  const service = services.get(chainId);
  if (!service) {
    return new NextResponse(null, {
      status: 501,
      statusText: `Unsupported chain: ${chainId}`,
    });
  }

  const signedTransaction = await service.encodeTransactionToBroadcast(chainId, transaction);

  const broadcastStatus = await service.broadcastTransaction(chainId, signedTransaction);

  return NextResponse.json(broadcastStatus);
}
