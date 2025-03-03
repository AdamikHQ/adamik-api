import { ProviderType, Token } from "~/app/model/types_WIP";
import { fetchERC20Info } from "~/app/families/evm/backend/node";
import { EvmService } from "../service";
import { EvmAddress } from "../types";
import { UnsupportedFeatureError, UserInputError } from "~/app/tools/handlers/errors";

async function getTokenInfo(this: EvmService, tokenId: string): Promise<Token> {
  const isAddressValid = await this.validateAddress(tokenId);
  if (!isAddressValid) {
    throw new UserInputError(`Invalid Address ${tokenId}`);
  }
  const contractAddress = tokenId as EvmAddress;
  try {
    const indexer = this.getIndexer();
    return await indexer.fetchERC20Token(this.chainId, contractAddress);
  } catch {
    // Node implementation - poor performance
    const node = this.getBackend(ProviderType.node);
    if (!node) {
      throw new UnsupportedFeatureError(`Unsupported feature Token Info for chain ${this.chainId}`);
    }
    return fetchERC20Info(this.chainId, contractAddress);
  }
}

export { getTokenInfo };
