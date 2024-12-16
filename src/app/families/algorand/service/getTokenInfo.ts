import { Token, TokenType } from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { fetchASA } from "../backend/node";
import { AlgorandService } from "../service";

async function getTokenInfo(this: AlgorandService, tokenId: string): Promise<Token> {
  const algoAsset = await fetchASA(tokenId);
  if (!algoAsset) {
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }

  const { name, unitName, decimals } = algoAsset;

  const token: Token = {
    type: TokenType.ASA,
    id: tokenId,
    name,
    ticker: unitName,
    decimals,
  };

  return token;
}

export { getTokenInfo };
