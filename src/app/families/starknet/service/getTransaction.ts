import { FinalizedTransaction } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction } from "../backend/indexer";
import { StarknetService } from "../service";

async function getTransaction(this: StarknetService, transactionId: string): Promise<FinalizedTransaction> {
  const finalizedTransaction = await fetchTransaction(transactionId);

  if (!finalizedTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  return finalizedTransaction;
}

export { getTransaction };
