import { Token, TokenType } from "~/app/model/types_WIP";
import { COSMOS_TOKENS } from "~/app/config/tokens/cosmos";
import { IBCToken } from "../types";
import { CosmosService } from ".";

async function getTokenInfo(this: CosmosService, tokenId: string): Promise<Token | null> {
  const token = COSMOS_TOKENS.find((token) => token.denom === tokenId) as IBCToken;
  if (!token) {
    return null;
  }

  return {
    chainId: this.chainId,
    type: TokenType.IBC,
    id: token.denom,
    name: token.symbol,
    ticker: token.symbol,
    decimals: token.decimals,
  };
}

export { getTokenInfo };
