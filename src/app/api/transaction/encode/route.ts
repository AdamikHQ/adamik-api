import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { completeTransaction } from "~/app/chains/algorand/service/completeTransaction";
import { encodeTransactionToSign } from "~/app/chains/algorand/service/encodeTransaction";
import { stringToBigint } from "~/app/model/serialization";
import {
  validateTransactionIntent,
  validateTransaction,
} from "~/app/chains/algorand/service/validateTransaction";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (zod)
  const { transaction: payload } = await request.json();

  // FIXME Replace with JSON.parse
  const transaction: PlainTransaction = stringToBigint(payload);

  const processedTransaction = await (async (): Promise<Transaction> => {
    switch (transaction.chain) {
      case "algorand":
        const transactionIntentStatus = await validateTransactionIntent(transaction);
        // FIXME Better use a throw/catch system for all kinds of errors?
        if (transactionIntentStatus.errors.length) {
          return {
            plain: transaction,
            status: transactionIntentStatus,
          };
        }

        const completedTransaction = await completeTransaction(transaction);

        const transactionStatus = await validateTransaction(completedTransaction);

        const fullTransactionStatus = {
          errors: transactionIntentStatus.errors.concat(transactionStatus.errors),
          warnings: transactionIntentStatus.warnings.concat(transactionStatus.warnings),
        };

        if (fullTransactionStatus.errors.length) {
          return {
            plain: completedTransaction,
            status: fullTransactionStatus,
          };
        }

        const encodedTransaction = await encodeTransactionToSign(completedTransaction);

        return {
          plain: completedTransaction,
          encoded: encodedTransaction,
          status: fullTransactionStatus,
        };
      default:
        return {} as Transaction;
    }
  })();

  return NextResponse.json(processedTransaction);
  //return new Response(JSON.stringify(encodedTransaction));
}
