import { FinalizedTransaction } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { fetchTransaction as fetchTransactionFromOklink } from "../backend/oklink";
import { fetchTransaction as fetchTransactionFromTronscan } from "../backend/tronscan";
import { TronService } from "../service";

async function getTransaction(this: TronService, transactionId: string): Promise<FinalizedTransaction> {
  const fetchTransactionFunctions = [fetchTransactionFromTronscan, fetchTransactionFromOklink];

  const errors: Error[] = [];

  for (const fetchTransactionFunction of fetchTransactionFunctions) {
    try {
      return await fetchTransactionFunction(transactionId);
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next service if available
    }
  }

  // That's means even failover didn't work
  console.warn(JSON.stringify(errors, null, 2));

  throw new ThirdPartyProviderError("Failed to fetch transaction");
}

export { getTransaction };
