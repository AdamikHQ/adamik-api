import { fetchBabylonDelegation } from "~/app/families/babylon/backend/babylonAPI";
import { FinalizedTransaction, TransactionMode } from "~/app/model/types_WIP";
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

  if (bitcoinTransaction.parsed) {
    // Poll the babylon backend to check whether it's a staking tx
    const babylonDelegationFound = await fetchBabylonDelegation(transactionId);
    bitcoinTransaction.parsed.mode = babylonDelegationFound
      ? TransactionMode.STAKE
      : TransactionMode.TRANSFER;
  }

  return bitcoinTransaction;
}

export { getTransaction };
