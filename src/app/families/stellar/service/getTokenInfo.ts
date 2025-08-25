import { Token } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { StellarService } from "../service";

async function getTokenInfo(this: StellarService, tokenId: string): Promise<Token> {
  throw new UnsupportedFeatureError("Not implemented yet");
}

export { getTokenInfo };
