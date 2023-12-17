import { Transaction, EncodedTransaction } from "~/app/model/transaction";
import {
  buildTransactionPayload,
  encodeToSign,
} from "~/app/chains/algorand/logic";
import { completeTransaction } from "./completeTransaction";

async function prepareTransactionToSign(
  transaction: Transaction
): Promise<EncodedTransaction> {
  const completedTransaction = await completeTransaction(transaction); // FIXME Shouldn't call another service?
  const transactionPayload = await buildTransactionPayload(
    completedTransaction
  );
  const encodedTransaction = encodeToSign(transactionPayload);

  return { transaction: completedTransaction, encoded: encodedTransaction };
}

export { prepareTransactionToSign };
