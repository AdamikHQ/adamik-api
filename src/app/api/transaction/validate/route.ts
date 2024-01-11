import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, TransactionStatus } from "~/app/model/types_WIP";
import { validateTransactionIntent } from "~/app/chains/algorand/service/validateTransaction";
import { stringToBigint } from "~/app/model/serialization";

// TODO WIP

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (zod)
  const { transaction: payload } = await request.json();

  // FIXME Replace with JSON.parse
  const transaction: PlainTransaction = stringToBigint(payload);

  const status = await (async (): Promise<TransactionStatus> => {
    switch (transaction.chain) {
      case "algorand":
        return await validateTransactionIntent(transaction);
      default:
        return {} as TransactionStatus;
    }
  })();

  return NextResponse.json(status);
  //return new Response(JSON.stringify(encodedTransaction));
}
