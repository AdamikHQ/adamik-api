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
    // Pre-validation
    const prevalidationStatus = await service.prevalidateTransaction(transaction);
    if (prevalidationStatus.errors.length) {
      return {
        plain: transaction,
        status: prevalidationStatus,
      };
    }

    // Completion + validation
    const completedTransaction = await service.completeTransaction(transaction);

    completedTransaction.status.warnings = completedTransaction.status.warnings.concat(
      prevalidationStatus.warnings || []
    );

    if (completedTransaction.status.errors.length) {
      return completedTransaction;
    }

    // Encoding
    completedTransaction.encoded = await service.encodeTransactionToSign(
      completedTransaction.plain,
      transaction.format
    );

    return completedTransaction;
  })();

  return NextResponse.json({ transaction: processedTransaction });
}
