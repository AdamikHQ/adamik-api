import { Token, TokenType } from "~/app/model/types_WIP";
import { TonService } from ".";
import { getJettonInfo } from "../backend/explorer";

async function getTokenInfo(this: TonService, tokenId: string): Promise<Token | null> {
  try {
    const jettonInfo = await getJettonInfo(tokenId);
    if (!jettonInfo) {
      return null;
    }

    const token: Token = {
      chainId: this.chainId,
      type: TokenType.JETTON,
      id: tokenId,
      name: jettonInfo.metadata.name,
      ticker: jettonInfo.metadata.symbol,
      decimals: Number(jettonInfo.metadata.decimals),
      logo: jettonInfo.metadata.image,
    };

    return token;
  } catch (e) {
    return null;
  }
}

export { getTokenInfo };
