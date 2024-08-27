import { AccountState, TokenAmount } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { AlgorandService } from ".";

async function getAccountState(
  this: AlgorandService,
  account: { addresses: string[] } | { accountId: string }
): Promise<AccountState> {
  if ("addresses" in account) {
    // FIXME: make it a better error message for the user
    throw new Error("Not implemented");
  }
  const { balance: nativeBalance, assetAmounts } = await fetchAccount(account.accountId);

  const tokenAmounts: TokenAmount[] = [];

  const tokenDetailsPromises = assetAmounts.map((assetAmount) => {
    return this.getTokenInfo(assetAmount.assetId);
  });

  const tokenDetails = await Promise.all(tokenDetailsPromises);

  tokenDetails.forEach((tokenDetail, index) => {
    if (tokenDetail) tokenAmounts.push({ token: tokenDetail, amount: assetAmounts[index].amount });
  });

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

export { getAccountState as getAddressState };
