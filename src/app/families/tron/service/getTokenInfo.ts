import { Token } from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { getTRC10TokenInfo, getTRC20TokenInfo } from "../backend/node";
import { TronService } from "../service";

async function getTokenInfo(this: TronService, tokenId: string): Promise<Token> {
  try {
    // TRC10 token IDs look like: '1002841'
    if (!isNaN(Number(tokenId))) {
      return getTRC10TokenInfo(tokenId);
    }
    // TRC20 token IDs look like: 'tafjulxivgt4qwk6uzwjqwzxtsagaqnvp4'
    return getTRC20TokenInfo(tokenId);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch tron token with ID '${tokenId}':`, e);
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }
}

export { getTokenInfo };
