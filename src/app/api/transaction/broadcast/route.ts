import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { BroadcastStatus, Transaction } from "~/app/model/types_WIP";
import { encodeTransactionToBroadcast } from "~/app/chains/algorand/service/encodeTransactionToBroadcast";
import { broadcastTransaction } from "~/app/chains/algorand/service/broadcastTransaction";
import { stringToBigint } from "~/app/model/serialization";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO validation/sanitization (zod)
  const { transaction: payload } = await request.json();

  // FIXME Replace with JSON.parse
  const transaction: Transaction = stringToBigint(payload);

  const broadcastStatus = await (async (): Promise<BroadcastStatus> => {
    switch (transaction.plain.chain) {
      case "algorand":
        const signedTransaction = await encodeTransactionToBroadcast(
          transaction
        );
        const status = await broadcastTransaction(signedTransaction);
        return status;
      default:
        return {
          // FIXME This is broken!
          // How to manage success & error responses ??
          error: {
            //code: "KO",
            message: `Unknown chain: ${transaction.plain.chain}`,
          },
        };
    }
  })();

  return NextResponse.json(broadcastStatus);
  //return new Response(JSON.stringify(broadcastStatus));
}
