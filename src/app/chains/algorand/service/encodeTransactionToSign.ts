import { PlainTransaction } from "~/app/model/types_WIP";
import { buildRawTransaction, encodeToSign } from "~/app/chains/algorand/logic";

async function encodeTransactionToSign(
  transaction: PlainTransaction
): Promise<string> {
  const rawTransaction = await buildRawTransaction(transaction);
  const encodedTransaction = encodeToSign(rawTransaction);

  return encodedTransaction;
}

export { encodeTransactionToSign };
