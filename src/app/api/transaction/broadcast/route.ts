import { BroadcastStatus, Transaction } from "~/app/model/types_WIP";
import { encodeTransactionToBroadcast } from "~/app/chains/algorand/service/encodeTransactionToBroadcast";
import { broadcastTransaction } from "~/app/chains/algorand/service/broadcastTransaction";

export async function POST(request: Request): Promise<Response> {
  // TODO validation/sanitization (zod)
  const { transaction }: { transaction: Transaction } = await request.json();

  const encodedTransaction = await (async (): Promise<BroadcastStatus> => {
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
            code: "KO",
            message: `Unknown chain: ${transaction.plain.chain}`,
          },
        };
    }
  })();

  return Response.json(encodedTransaction);
}
