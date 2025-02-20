import { AccountTokens, Paginated, ProviderType } from "~/app/model/types_WIP";
import { MoralisIndexer } from "../backend/moralis";
import { AlchemyIndexer } from "../backend/alchemy";
import { EvmService } from "../service";
import { EvmAddress } from "../types";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";

async function getAccountTokens(
  this: EvmService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  let backend = this.getBackend(ProviderType.moralis);
  let indexer = MoralisIndexer;
  if (!backend) {
    backend = this.getBackend(ProviderType.alchemy);
    indexer = AlchemyIndexer;
  }
  if (!backend || !indexer) {
    throw new UnsupportedFeatureError(`Unsupported feature Account History for chain ${this.chainId}`);
  }
  const { tokens, nextPage } = await indexer.fetchERC20TokenAmounts(
    this.chainId,
    accountId as EvmAddress,
    paginationToken
  );

  return {
    tokens,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
