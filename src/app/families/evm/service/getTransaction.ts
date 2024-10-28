import { FinalizedTransaction, Status } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { EvmService } from ".";
import { fetchTransaction, moralisToAdamikTransaction } from "../backend/moralis";

async function getTransaction(
  this: EvmService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  const evmTransaction = await fetchTransaction(this.chainId, transactionId);
  if (!evmTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  const parsedTransaction = moralisToAdamikTransaction(this.chainId, evmTransaction);

  return {
    parsed: parsedTransaction,
    raw: evmTransaction,
  };
}

export { getTransaction };
