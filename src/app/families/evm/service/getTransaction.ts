import { FinalizedTransaction, ProviderType, Status } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError, UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { MoralisIndexer } from "../backend/moralis";
import { AlchemyIndexer } from "~/app/families/evm/backend/alchemy";
import { EvmService } from "../service";

async function getTransaction(
  this: EvmService,
  transactionId: string,
  status: Status
): Promise<FinalizedTransaction> {
  let backend = this.getBackend(ProviderType.moralis);
  let indexer = MoralisIndexer;
  if (!backend) {
    backend = this.getBackend(ProviderType.alchemy);
    indexer = AlchemyIndexer;
  }
  if (!backend || !indexer) {
    throw new UnsupportedFeatureError(`Unsupported feature Transaction for chain ${this.chainId}`);
  }
  const evmTransaction = await indexer.fetchTransaction(this.chainId, transactionId);
  if (!evmTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  return evmTransaction;
}

export { getTransaction };
