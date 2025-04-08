import { FinalizedTransaction, Status } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction } from "../backend/indexer";
import { SolanaService } from "../service";

async function getTransaction(
  this: SolanaService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  const solanaTransaction = await fetchTransaction(transactionId);
  if (!solanaTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  return solanaTransaction;
}

export { getTransaction };
