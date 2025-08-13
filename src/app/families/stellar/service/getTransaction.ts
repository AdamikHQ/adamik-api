import { FinalizedTransaction, Status } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction, stellarToAdamikTransaction } from "../backend/horizon";
import { StellarService } from "../service";

async function getTransaction(
  this: StellarService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  const horizonTransaction = await fetchTransaction(transactionId);
  if (!horizonTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  const parsed = await stellarToAdamikTransaction(horizonTransaction);

  return {
    parsed,
    raw: horizonTransaction,
  };
}

export { getTransaction };
