import { Token, TokenType } from "~/app/model/types_WIP";
import { getCoinData } from "~/app/families/aptos/backend/indexer";
import { AptosService } from "~/app/families/aptos/service";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";

export async function getTokenInfo(this: AptosService, tokenId: string): Promise<Token> {
  try {
    return await getCoinData(this.chainId, tokenId);
  } catch (e) {
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }
}
