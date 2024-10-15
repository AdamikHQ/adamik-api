import { FinalizedTransaction, Status } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { CosmosService } from ".";
import { fetchTransaction, mintscanToAdamikTransaction } from "../backend/mintscan";

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

  return parsedTransaction
    ? {
        parsed: parsedTransaction,
        raw: cosmosTransaction,
      }
    : {
        raw: cosmosTransaction,
      };
}

export { getTransaction };
