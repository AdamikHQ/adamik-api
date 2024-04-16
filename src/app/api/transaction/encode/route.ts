import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { services } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (zod)
  const { transaction: payload } = await request.json();

  // FIXME Replace with JSON.parse
  const transaction: PlainTransaction = {
    ...stringToBigint(payload),
    senders: [...payload.senders],
    recipients: [...payload.recipients],
    validator: payload.validator ? payload.validator : undefined,
  };

  const { chainId } = transaction;

  const service = services.get(chainId);
  if (!service) {
    return new NextResponse(null, {
      status: 501,
      statusText: `Unsupported chain: ${chainId}`,
    });
  }

  const processedTransaction = await (async (): Promise<Transaction> => {
    const transactionIntentStatus = await service.validateTransactionIntent(chainId, transaction);
    // FIXME Better use a throw/catch system for all kinds of errors?
    if (transactionIntentStatus.errors.length) {
      return {
        plain: transaction,
        status: transactionIntentStatus,
      };
    }

    const completedTransaction = await service.completeTransaction(chainId, transaction);

    const transactionStatus = await service.validateTransaction(chainId, completedTransaction);

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

    const encodedTransaction = await service.encodeTransactionToSign(
      chainId,
      completedTransaction,
      transaction.format
    );

    return {
      plain: completedTransaction,
      encoded: encodedTransaction,
      status: fullTransactionStatus,
    };
  })();

  return NextResponse.json(processedTransaction);
}
