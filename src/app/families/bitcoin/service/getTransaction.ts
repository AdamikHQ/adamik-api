import { FinalizedTransaction } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { getTransactionfromProviders } from "../../common";
import { fetchTransaction as fetchTransactionFromBlockchair } from "../backend/blockchair";
import { fetchTransaction as fetchTransactionFromMS } from "../backend/mempoolSpace";
import { isValidTransactionHash } from "../logic";
import { BitcoinService } from "../service";

async function getTransaction(this: BitcoinService, transactionId: string): Promise<FinalizedTransaction> {
  if (!isValidTransactionHash(transactionId)) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  // FIXME Doesn't take into account:
  // - supported providers by chain
  // - supported functions by provider
  const fetchTransactionFunctions = [fetchTransactionFromMS, fetchTransactionFromBlockchair];

  const bitcoinTransaction = await getTransactionfromProviders(
    this.chainId,
    transactionId,
    fetchTransactionFunctions
  );

  if (!bitcoinTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  return bitcoinTransaction;
}

export { getTransaction };
