import { ChainFeatures, Token } from "~/app/model/types_WIP";
import { fetchERC20Token, MORALIS_CHAIN_IDS } from "../backend/moralis";
import { EvmService } from "../service";
import { EvmAddress } from "../types";
import { CHAINS } from "~/app/config/chains";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { getProvider } from "~/app/config/provider";

async function getTokenInfo(this: EvmService, tokenId: string): Promise<Token> {
  const contractAddress = tokenId as EvmAddress;

  // FIXME: We can achieve a 100% if-less implementation in the future but for now we are not breaking
  //        internal compatibility
  const moralisChainId = MORALIS_CHAIN_IDS.get(this.chainId);
  if (moralisChainId) {
    return fetchERC20Token(this.chainId, contractAddress);
  }

  const providers = CHAINS[this.chainId].providers?.filter((provider) =>
    provider.features.includes(ChainFeatures.READ__TOKENS)
  );
  if (providers === undefined || providers.length === 0) {
    throw new UnsupportedFeatureError(`Unsupported feature for chainId '${this.chainId}'`);
  }
  // FIXME: maybe instead of picking at random, we might have a preferred backend?
  const index = Math.floor(Math.random() * providers.length);
  const backend = providers[index];
  // Note: call this route multiple times and watch this log
  console.log(`[INFO] using backend ${backend.type}`);
  const provider = getProvider(this.chainId, backend);
  return provider.getTokenDetails(this.chainId, tokenId);
}

export { getTokenInfo };
