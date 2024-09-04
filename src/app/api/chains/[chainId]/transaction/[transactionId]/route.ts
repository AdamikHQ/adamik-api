import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getService } from "~/app/families/services";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import "~/patch";
import { requestSchema } from "./schema";

type Params = z.infer<typeof requestSchema>;

export async function GET(_: NextRequest, context: { params: Params }): Promise<NextResponse> {
  const { chainId, transactionId } = requestSchema.parse(context.params);

  const service = getService(chainId);

  const transaction = await service.getTransaction(transactionId);

  return transaction
    ? NextResponse.json(transaction)
    : NextResponse.json(
        { message: `Transaction ${transactionId} not found for chainId ${chainId}` },
        { status: 400, statusText: `Transaction not found` }
      );
}

module.exports = apiHandler({
  GET,
});
