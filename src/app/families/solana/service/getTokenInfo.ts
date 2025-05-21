import { Token } from "~/app/model/types_WIP";
import { UnsupportedTokenIDError } from "~/app/tools/handlers/errors";
import { fetchAssetInfo } from "../backend/node";
import { SolanaService } from "../service";

async function getTokenInfo(this: SolanaService, tokenId: string): Promise<Token> {
  const token = await fetchAssetInfo(tokenId);

  if (!token) {
    throw new UnsupportedTokenIDError(tokenId, this.chainId);
  }

  return token;
}

export { getTokenInfo };
