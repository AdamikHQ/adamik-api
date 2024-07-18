import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { stringToBigint } from "~/app/model/serialization";
import { Transaction, TransactionData } from "~/app/model/types_WIP";
import { deepBigintOrNumToString } from "~/app/tools/convertors/deepBigintToString";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(
  async (body) => {
    const transactionData: TransactionData = stringToBigint(body.transaction.data);

    const service = getService(transactionData.chainId);

    // Initialization of the full transaction that will be returned
    // NOTE It will traverse and be mutated by all the service functions below
    let transaction: Transaction = {
      data: transactionData,
      status: { errors: [], warnings: [] },
    };

    await service.prevalidateTransaction(transaction);
    if (transaction.status.errors.length) {
      return NextResponse.json(
        { transaction: deepBigintOrNumToString(transaction) },
        { status: 400, statusText: `Invalid transaction` }
      );
    }

    await service.completeTransaction(transaction);
    if (transaction.status.errors.length) {
      return NextResponse.json(
        { transaction: deepBigintOrNumToString(transaction) },
        { status: 400, statusText: `Invalid transaction` }
      );
    }

    await service.validateTransaction(transaction);
    if (transaction.status.errors.length) {
      return NextResponse.json(
        { transaction: deepBigintOrNumToString(transaction) },
        { status: 400, statusText: `Invalid transaction` }
      );
    }

    await service.encodeTransactionToSign(transaction);

    if (transaction.status.errors.length) {
      return NextResponse.json(
        { transaction: deepBigintOrNumToString(transaction) },
        { status: 400, statusText: `Invalid transaction` }
      );
    } else {
      return NextResponse.json({ transaction: deepBigintOrNumToString(transaction) });
    }
  },
  {
    requestSchema,
    responseSchema,
  }
);
