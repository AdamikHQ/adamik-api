import { Token, TokenType } from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { fetchTokenInfo } from "../backend/node";
import { StarknetService } from "../service";

async function getTokenInfo(this: StarknetService, tokenId: string): Promise<Token> {
  const tokenInfo = await fetchTokenInfo(tokenId);

  if (!tokenInfo) {
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }

  return {
    type: TokenType.ERC20,
    id: tokenInfo.id,
    name: tokenInfo.name,
    ticker: tokenInfo.ticker,
    decimals: tokenInfo.decimals,
  };
}

export { getTokenInfo };
