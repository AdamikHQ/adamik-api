import { Transaction } from "~/app/model/transaction";
import { completeTransaction } from "~/app/chains/algorand/service/completeTransaction";

export async function POST(request: Request): Promise<Response> {
  // TODO validation/sanitization
  const { chain, transaction } = await request.json();

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

  const completedTransaction = await (async (): Promise<Transaction> => {
    switch (chain) {
      case "algorand":
        return await completeTransaction(transaction);
      default:
        return {} as Transaction;
    }
  })();

  const response = {
    transaction: completedTransaction,
  };

  return Response.json(response);
}
