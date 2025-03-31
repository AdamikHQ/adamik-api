import { Token, TokenType } from "~/app/model/types_WIP";
import { getCoinData } from "~/app/families/aptos/backend/indexer";
import { AptosService } from "~/app/families/aptos/service";

export async function getTokenInfo(this: AptosService, tokenId: string): Promise<Token> {
  try {
    return await getCoinData(this.chainId, tokenId);
  } catch (e) {
    return {
      type: TokenType.APTOS_COIN,
      id: "",
      name: "",
      ticker: "",
      decimals: 0,
    };
  }
}
