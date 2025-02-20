import { ProviderType, Token } from "~/app/model/types_WIP";
import { MoralisIndexer } from "../backend/moralis";
import { AlchemyIndexer } from "../backend/alchemy";
import { fetchERC20Info } from "~/app/families/evm/backend/node";
import { EvmService } from "../service";
import { EvmAddress } from "../types";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";

async function getTokenInfo(this: EvmService, tokenId: string): Promise<Token> {
  let backend = this.getBackend(ProviderType.moralis);
  let indexer = MoralisIndexer;
  if (!backend) {
    backend = this.getBackend(ProviderType.alchemy);
    indexer = AlchemyIndexer;
  }
  const contractAddress = tokenId as EvmAddress;
  if (!backend || !indexer) {
    // Node implementation - poor performance
    const node = this.getBackend(ProviderType.node);
    if (!node) {
      throw new UnsupportedFeatureError(`Unsupported feature Token Info for chain ${this.chainId}`);
    }
    return fetchERC20Info(this.chainId, contractAddress);
  }

  return indexer.fetchERC20Token(this.chainId, contractAddress);
}

export { getTokenInfo };
