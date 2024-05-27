import { Token, TokenType } from "~/app/model/types_WIP";
import { fetchASA } from "../backend/node";
import { AlgorandService } from ".";

async function getTokenInfo(this: AlgorandService, tokenId: string): Promise<Token | null> {
  try {
    const algoAsset = await fetchASA(tokenId);
    if (!algoAsset) {
      return null;
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
    return null;
  }
}

export { getTokenInfo };
