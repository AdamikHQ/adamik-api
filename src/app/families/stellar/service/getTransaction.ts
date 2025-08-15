import { FinalizedTransaction, Status } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction } from "../backend/horizon";
import { StellarService } from "../service";

async function getTransaction(
  this: StellarService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  const stellarTransaction = await fetchTransaction(transactionId);
  if (!stellarTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  return stellarTransaction;
}

export { getTransaction };
