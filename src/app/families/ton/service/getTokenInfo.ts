import { Token, TokenType } from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { TonService } from ".";
import { getJettonInfo } from "../backend/explorer";

async function getTokenInfo(this: TonService, tokenId: string): Promise<Token> {
  try {
    const jettonInfo = await getJettonInfo(tokenId);
    if (!jettonInfo) {
      throw new UnsupportedTokenIDError(tokenId, this.chainId);
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
    console.log(`/!\\ Failed to fetch token info for ${tokenId} on chain ${this.chainId}: ${e}`);
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }
}

export { getTokenInfo };
