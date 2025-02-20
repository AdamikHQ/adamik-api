import { AccountHistory, Paginated, ProviderType } from "~/app/model/types_WIP";
import { MoralisIndexer } from "~/app/families/evm/backend/moralis";
import { AlchemyIndexer } from "~/app/families/evm/backend/alchemy";
import { EvmService } from "../service";
import { EvmAddress } from "../types";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";

async function getAccountHistory(
  this: EvmService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  let backend = this.getBackend(ProviderType.moralis);
  let indexer = MoralisIndexer;
  if (!backend) {
    backend = this.getBackend(ProviderType.alchemy);
    indexer = AlchemyIndexer;
  }
  if (!backend || !indexer) {
    throw new UnsupportedFeatureError(`Unsupported feature Account History for chain ${this.chainId}`);
  }
  const { evmTransactions, nextPage } = await indexer.fetchAccountTransactions(
    this.chainId,
    accountId as EvmAddress,
    paginationToken
  );

  return {
    transactions: evmTransactions,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountHistory };
