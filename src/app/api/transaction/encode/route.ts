import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { completeTransaction } from "~/app/chains/algorand/service/completeTransaction";
import { encodeTransactionToSign } from "~/app/chains/algorand/service/encodeTransactionToSign";
import { stringToBigint } from "~/app/model/serialization";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (zod)
  const { transaction: payload } = await request.json();

  // FIXME Replace with JSON.parse
  const transaction: PlainTransaction = stringToBigint(payload);

  const encodedTransaction = await (async (): Promise<Transaction> => {
    switch (transaction.chain) {
      case "algorand":
        const completedTransaction = await completeTransaction(transaction);
        const encodedTransaction = await encodeTransactionToSign(
          completedTransaction
        );
        return { plain: completedTransaction, encoded: encodedTransaction };
      default:
        return {} as Transaction;
    }
  })();

  return NextResponse.json(encodedTransaction);
  //return new Response(JSON.stringify(encodedTransaction));
}
