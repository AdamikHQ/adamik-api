import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { fetchTransactionByHash } from "~/app/families/aptos/backend/node";
import { AptosService } from "~/app/families/aptos/service";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import {
  aptosToAdamikTransaction,
  getAmount,
  getRecipient,
  getTransactionMode,
} from "~/app/families/aptos/logic";

export async function getTransaction(this: AptosService, txId: string): Promise<FinalizedTransaction> {
  const tx = await fetchTransactionByHash(this.chainId, txId);
  if (tx === null) {
    throw new TransactionIdNotFoundError(txId, this.chainId);
  }

  return aptosToAdamikTransaction(tx);
}
