import { FinalizedTransaction, Status } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction, mintscanToAdamikTransaction } from "../backend/mintscan";
import { CosmosService } from "../service";

async function getTransaction(
  this: CosmosService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  const cosmosTransaction = await fetchTransaction(this.chainId, transactionId);
  if (!cosmosTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  const parsedTransaction = mintscanToAdamikTransaction(this.chainId, cosmosTransaction);

  return {
    parsed: parsedTransaction,
    raw: cosmosTransaction,
  };
}

export { getTransaction };
