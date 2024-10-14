import { Token, TokenType } from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { TronService } from ".";
import { getTRC10TokenInfo, getTRC20TokenInfo } from "../backend/node";

async function getTokenInfo(this: TronService, tokenId: string): Promise<Token> {
  try {
    if (!isNaN(Number(tokenId))) {
      const tokenInfo = await getTRC10TokenInfo(tokenId);

      return {
        chainId: this.chainId,
        type: TokenType.TRC10,
        id: tokenId,
        name: tokenInfo.name,
        ticker: tokenInfo.abbr,
        decimals: tokenInfo.precision,
      };
    }

    const tokenInfo = await getTRC20TokenInfo(tokenId);

    const token: Token = {
      chainId: this.chainId,
      type: TokenType.TRC20,
      id: tokenId,
      name: tokenInfo.name,
      ticker: tokenInfo.symbol,
      decimals: Number(tokenInfo.decimals),
      contractAddress: tokenId,
    };

    return token;
  } catch (e) {
    console.warn(`/!\\ Failed to fetch tron token with ID '${tokenId}':`, e);
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }
}

export { getTokenInfo };
