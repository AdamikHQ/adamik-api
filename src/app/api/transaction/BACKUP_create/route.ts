import { TransactionMode } from "~/app/model/transaction";
import { createTransaction } from "~/app/chains/algorand/service/createTransaction";

export async function POST(request: Request): Promise<Response> {
  // TODO validation/sanitization
  const { chain, type } = await request.json();

  if (!chain) {
    return new Response(null, {
      status: 400,
      statusText: "Field `chain` is required",
    });
  }

  if (!type) {
    return new Response(null, {
      status: 400,
      statusText: "Field `type` is required",
    });
  }

  // FIXME
  /*
  if (!Object.values(TransactionMode).includes(type)) {
    return new Response(null, {
      status: 400,
      statusText: `Unsupported transaction type: ${type}`,
    });
  }
  */

  let transaction;
  switch (chain) {
    case "algorand":
      transaction = createTransaction(type);
      break;
    default:
      return new Response(null, {
        status: 400,
        statusText: `Unsupported chain: ${chain}`,
      });
  }

  return Response.json(transaction);
}
