import { AccountState, TokenAmount } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { getERC20TokenAmounts } from "../backend/moralis";
import { getBalance } from "../backend/node";
import { EvmAddress } from "../types";

async function getAccountState(
  this: EvmService,
  account: { addresses: string[] } | { accountId: EvmAddress }
): Promise<AccountState> {
  if ("addresses" in account) {
    // FIXME: make it a better error message for the user
    throw new Error("Not implemented");
  }
  // Native
  const nativeBalance = await getBalance(this.chainId, account.accountId);

  // Tokens

  // TODO Providers abstraction https://adamik.atlassian.net/browse/ADV-201

  //*
  // Moralis implementation

  const tokenAmounts: TokenAmount[] = await getERC20TokenAmounts(this.chainId, account.accountId);

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
    accountId: account.accountId,
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
