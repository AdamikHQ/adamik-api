import { FinalizedTransaction } from "~/app/model/types_WIP";
import { fetchTransaction as fetchTransactionFromOklink } from "../backend/oklink";
import { fetchTransaction as fetchTransactionFromTronscan } from "../backend/tronscan";
import { TronService } from "../service";

async function getTransaction(this: TronService, transactionId: string): Promise<FinalizedTransaction> {
  const fetchTransactionFunctions = [fetchTransactionFromTronscan, fetchTransactionFromOklink];

  let errors: Error[] = [];

  for (const fetchTransactionFunction of fetchTransactionFunctions) {
    try {
      return await fetchTransactionFunction(transactionId);
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next service if available
    }
  }

  // That's means even failover didn't work
  console.error(JSON.stringify(errors, null, 2));

  throw new Error(`Failed to fetch transaction from all backends: ${errors.at(-1)?.message}`);
}

export { getTransaction };
