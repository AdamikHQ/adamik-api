import { fetchERC20Info } from "~/app/families/evm/backend/node";
import { ProviderType, Token } from "~/app/model/types_WIP";
import { UnsupportedFeatureError, UserInputError } from "~/app/tools/handlers/errors";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getTokenInfo(this: EvmService, tokenId: string): Promise<Token> {
  const isTokenIDValid = await this.validateAddress(tokenId);
  if (!isTokenIDValid) {
    throw new UserInputError(`Invalid token ID ${tokenId}`);
  }

  const contractAddress = tokenId as EvmAddress;
  try {
    const indexer = this.getIndexer();
    return await indexer.fetchERC20Token(this.chainId, contractAddress);
  } catch {
    // Node implementation - poor performance
    const node = this.getProvider(ProviderType.node);
    if (!node) {
      throw new UnsupportedFeatureError(`Unsupported feature Token Info for chain ${this.chainId}`);
    }
    return fetchERC20Info(this.chainId, contractAddress);
  }
}

export { getTokenInfo };
