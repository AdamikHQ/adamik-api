import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { services } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
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

  const service = services.get(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
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

  return NextResponse.json({ transaction: processedTransaction });
}
