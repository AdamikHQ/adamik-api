import { AccountState, TokenAmount } from "~/app/model/types_WIP";
import { fetchERC20TokenAmounts } from "../backend/moralis";
import { fetchBalance } from "../backend/node";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function getAccountState(this: EvmService, accountId: EvmAddress): Promise<AccountState> {
  // Native
  const nativeBalance = await fetchBalance(this.chainId, accountId);

  // Tokens

  // TODO Providers abstraction https://adamik.atlassian.net/browse/ADV-201

  //*
  // Moralis implementation

  const tokenAmounts: TokenAmount[] = await fetchERC20TokenAmounts(this.chainId, accountId);

  /*/
  // Etherscan implementation

  const events = await getERC20TransferEvents(this.chainId, address);
  const eventPerContractAddress = getOneEventPerContractAddress(events);

  const tokenBalancePromises = [];
  const tokenDetailsPromises = [];

  for (const { contractAddress } of eventPerContractAddress.values()) {
    tokenBalancePromises.push(
      fetchERC20Balance({
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
    accountId,
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAccountState };
