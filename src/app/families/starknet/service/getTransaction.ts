import { FinalizedTransaction } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction, starkScanToAdamikTransaction } from "../backend/indexer";
import { StarknetService } from "../service";

async function getTransaction(this: StarknetService, transactionId: string): Promise<FinalizedTransaction> {
  const transaction = await fetchTransaction(transactionId);

  if (!transaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  const parsedTransaction = await starkScanToAdamikTransaction(transaction);

  return {
    parsed: parsedTransaction,
    raw: transaction,
  };
}

export { getTransaction };
