import { AddressState, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { EvmAddress } from "../types";
import { getOneEventPerContractAddress } from "../logic";
import { getBalance, getERC20Balance } from "../backend/node";
import { getERC20TransferEvents } from "../backend/etherscan";
import { getERC20TokenAmounts } from "../backend/moralis";
import { EvmService } from ".";

async function getAddressState(this: EvmService, address: EvmAddress): Promise<AddressState> {
  // Native
  const nativeBalance = await getBalance(this.chainId, address);

  // Tokens

  // TODO Providers abstraction https://adamik.atlassian.net/browse/ADV-201

  //*
  // Moralis implementation

  const tokenAmounts: TokenAmount[] = await getERC20TokenAmounts(this.chainId, address);

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
        amount: tokenBalances[index] as bigint,
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
        total: nativeBalance,
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAddressState };
