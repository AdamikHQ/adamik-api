import { FinalizedTransaction, Status } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { EvmService } from "../service";

async function getTransaction(
  this: EvmService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  const indexer = this.getIndexer();
  const evmTransaction = await indexer.fetchTransaction(this.chainId, transactionId);
  if (!evmTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  return evmTransaction;
}

export { getTransaction };
