import "~/patch";
import { NextRequest, NextResponse } from "next/server";
import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { SERVICES } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { requestSchema } from "./schema";
import { handleRequestValidationError } from "~/app/api/schemaCommon";
import z from "zod";

type EncodeBodySchema = z.infer<typeof requestSchema>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: EncodeBodySchema = await request.json();
  try {
    requestSchema.parse(body);
  } catch (e) {
    return handleRequestValidationError(e);
  }

  const transaction: PlainTransaction = stringToBigint(body.transaction.plain);
  const { chainId } = transaction;

  const service = SERVICES.get(chainId);
  if (!service) {
    return NextResponse.json(
      { message: `Chain ID ${chainId} is not supported` },
      { status: 400, statusText: `Unsupported chainId` }
    );
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

    try {
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

      const encodedTransaction = await service.encodeTransactionToSign(
        completedTransaction,
        transaction.format
      );

      return {
        plain: completedTransaction,
        encoded: encodedTransaction,
        status: fullTransactionStatus,
      };
    } catch (e: any) {
      // FIXME Probably will need to have a specific error
      return {
        plain: transaction,
        status: {
          errors: [{ message: e.message }],
          warnings: [],
        },
      };
    }
  })();

  return NextResponse.json({ transaction: processedTransaction });
}
