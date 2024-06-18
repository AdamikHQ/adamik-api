import { getBalance, getERC20Balance } from "../backend/node";
import { EvmService } from ".";
import { AddressState, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { EvmAddress } from "../types";
import { getOneEventPerContractAddress } from "../logic";
import { getERC20TransferEvents } from "../backend/etherscan";
import { getTokens } from "../backend/moralis";

async function getAddressState(this: EvmService, address: EvmAddress): Promise<AddressState> {
  // Native
  const nativeBalance = await getBalance(this.chainId, address);

  // Tokens
  const tokenAmounts: TokenAmount[] = [];

  //*
  // Moralis implementation

  const tokensData = await getTokens(this.chainId, address);
  tokensData?.forEach((tokenData) =>
    tokenAmounts.push({
      token: {
        chainId: this.chainId,
        type: TokenType.ERC20,
        id: tokenData.token_address,
        name: tokenData.name,
        decimals: tokenData.decimals,
        ticker: tokenData.symbol,
        contractAddress: tokenData.token_address,
      },
      value: BigInt(tokenData.balance),
    })
  );

  /*/
  // Etherscan implementation

  const events = await getERC20TransferEvents(this.chainId, address);
  const eventPerContractAddress = getOneEventPerContractAddress(events);

  const tokenBalancePromises = [];
  const tokenDetailsPromises = [];

  for (const { contractAddress } of eventPerContractAddress.values()) {
    tokenBalancePromises.push(
      getERC20Balance({
        chainId: this.chainId,
        contractAddress,
        senderAddress: address,
      }).catch(() => null)
    );

    tokenDetailsPromises.push(this.getTokenInfo(contractAddress).catch(() => null));
  }

  const tokenBalances = await Promise.all(tokenBalancePromises);
  const tokenDetails = await Promise.all(tokenDetailsPromises);

  tokenDetails.forEach((tokenDetail, index) => {
    if (tokenDetail && tokenBalances[index]) {
      tokenAmounts.push({
        token: tokenDetail,
        value: tokenBalances[index] as bigint,
      });
    }
  });
  //*/

  return {
    chainId: this.chainId,
    address,
    balances: {
      native: {
        available: nativeBalance,
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAddressState };
