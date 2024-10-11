import { Token } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { fetchERC20Token } from "../backend/moralis";
import { EvmAddress } from "../types";

async function getTokenInfo(this: EvmService, tokenId: string): Promise<Token> {
  const contractAddress = tokenId as EvmAddress;

  return fetchERC20Token(this.chainId, contractAddress);

  // Node implementation - poor performance
  /*
  try {
    const name = await fetchERC20name(this.chainId, contractAddress);
    const decimals = await fetchERC20Decimals(this.chainId, contractAddress);
    const ticker = await fetchERC20Ticker(this.chainId, contractAddress);

    const token: Token = {
      chainId: this.chainId,
      type: TokenType.ERC20,
      id: contractAddress,
      name,
      ticker,
      decimals,
      contractAddress,
    };

    return token;
  } catch (e) {
    return null;
  }
  */
}

export { getTokenInfo };
