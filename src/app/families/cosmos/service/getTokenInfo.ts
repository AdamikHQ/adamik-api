import { COSMOS_TOKENS } from "~/app/config/tokens/cosmos";
import { Token, TokenType } from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { CosmosService } from "../service";
import { IBCToken } from "../types";

async function getTokenInfo(this: CosmosService, tokenId: string): Promise<Token> {
  const token = COSMOS_TOKENS.find((token) => token.denom === tokenId) as IBCToken;
  if (!token) {
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }

  return {
    type: TokenType.IBC,
    id: token.denom,
    name: token.symbol,
    ticker: token.symbol,
    decimals: token.decimals,
  };
}

export { getTokenInfo };
