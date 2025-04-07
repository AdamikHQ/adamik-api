import { fetchBabylonDelegation } from "~/app/families/cosmos/backend/babylon";
import { ChainId, FinalizedTransaction, TransactionMode } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction as fetchTransactionFromBlockchair } from "../backend/blockchair";
import { fetchTransaction as fetchTransactionFromMempoolSpace } from "../backend/mempoolSpace";
import { isValidTransactionHash } from "../logic";
import { BitcoinService } from "../service";

async function getTransaction(this: BitcoinService, transactionId: string): Promise<FinalizedTransaction> {
  if (!isValidTransactionHash(transactionId)) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  // For bitcoin-signet, use mempool.space API
  // FIXME Implementations for different providers should be handled
  // properly through provider abstraction, same as done in EVM & Tron family
  const fetchTransactionFunction =
    this.chainId === ChainId.BITCOIN_SIGNET
      ? fetchTransactionFromMempoolSpace
      : fetchTransactionFromBlockchair;

  const bitcoinTransaction = await fetchTransactionFunction(this.chainId, transactionId);
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
