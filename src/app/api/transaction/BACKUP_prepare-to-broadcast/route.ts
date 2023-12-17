import { EncodedTransaction } from "~/app/model/transaction";
import { encodeTransactionToBroadcast } from "~/app/chains/algorand/service/encodeTransactionToBroadcast";

export async function POST(request: Request): Promise<Response> {
  // TODO validation/sanitization
  const { chain, transaction, signature } = await request.json();

  if (!chain) {
    return new Response(null, {
      status: 400,
      statusText: "Field `chain` is required",
    });
  }

  if (!transaction) {
    return new Response(null, {
      status: 400,
      statusText: "Field `transaction` is required",
    });
  }

  const encodedTransaction = await (async (): Promise<EncodedTransaction> => {
    switch (chain) {
      case "algorand":
        return await encodeTransactionToBroadcast(transaction, signature);
      default:
        return {} as EncodedTransaction;
    }
  })();

  return Response.json(encodedTransaction);
}
