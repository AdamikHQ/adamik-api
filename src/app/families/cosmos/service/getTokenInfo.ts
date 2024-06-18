import { Token, TokenType } from "~/app/model/types_WIP";
import { fetchIBCTokenTicker } from "../backend/node";
import { CosmosService } from ".";
import { CHAINS } from "~/app/config/chains";

async function getTokenInfo(this: CosmosService, tokenId: string): Promise<Token | null> {
  try {
    const ibcTokenTicker = await fetchIBCTokenTicker(this.chainId, tokenId);
    if (!ibcTokenTicker) {
      return null;
    }

    const chain = CHAINS[this.chainId];

    const token: Token = {
      chainId: this.chainId,
      type: TokenType.IBC,
      id: tokenId,
      name: ibcTokenTicker,
      ticker: ibcTokenTicker,
      decimals: chain.decimals,
    };

    return token;
  } catch (e) {
    return null;
  }
}

export { getTokenInfo };
