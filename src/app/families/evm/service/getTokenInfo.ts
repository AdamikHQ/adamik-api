import { Token, TokenType } from "~/app/model/types_WIP";
import { EvmAddress } from "../types";
import { getERC20name, getERC20Decimals, getERC20Ticker } from "../backend/node";
import { getERC20Token } from "../backend/moralis";
import { EvmService } from ".";

async function getTokenInfo(this: EvmService, tokenId: string): Promise<Token | null> {
  const contractAddress = tokenId as EvmAddress;

  return getERC20Token(this.chainId, contractAddress);

  // Node implementation - poor performance
  /*
  try {
    const name = await getERC20name(this.chainId, contractAddress);
    const decimals = await getERC20Decimals(this.chainId, contractAddress);
    const ticker = await getERC20Ticker(this.chainId, contractAddress);

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
