import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { services } from "~/app/chains/services";
import { stringToBigint } from "~/app/model/serialization";

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

  const processedTransaction = await (async (): Promise<Transaction> => {
    const transactionIntentStatus = await service.validateTransactionIntent(transaction);
    // FIXME Better use a throw/catch system for all kinds of errors?
    if (transactionIntentStatus.errors.length) {
      return {
        plain: transaction,
        status: transactionIntentStatus,
      };
    }

    const completedTransaction = await service.completeTransaction(transaction);

    const transactionStatus = await service.validateTransaction(completedTransaction);

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

    const encodedTransaction = await service.encodeTransactionToSign(completedTransaction);

    return {
      plain: completedTransaction,
      encoded: encodedTransaction,
      status: fullTransactionStatus,
    };
  })();

  return NextResponse.json(processedTransaction);
  //return new Response(JSON.stringify(encodedTransaction));
}
