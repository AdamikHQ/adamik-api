import { Token, TokenType } from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { AlgorandService } from ".";
import { fetchASA } from "../backend/node";

async function getTokenInfo(this: AlgorandService, tokenId: string): Promise<Token> {
  try {
    const algoAsset = await fetchASA(tokenId);
    if (!algoAsset) {
      throw new UnsupportedTokenIDError(tokenId, this.chainId);
    }

    const { name, unitName, decimals } = algoAsset;

    const token: Token = {
      chainId: this.chainId,
      type: TokenType.ASA,
      id: tokenId,
      name,
      ticker: unitName,
      decimals,
    };

    return token;
  } catch (e) {
    console.warn(`/!\\ Failed to fetch token info for ${tokenId} on chain ${this.chainId}: ${e}`);
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }
}

export { getTokenInfo };
