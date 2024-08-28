import { AccountState, TokenAmount } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { AlgorandService } from ".";

async function getAccountState(
  this: AlgorandService,
  account: { addresses: string[] } | { accountId: string }
): Promise<AccountState> {
  if ("addresses" in account) {
    // TODO Maybe a specific MultiAddressesService would be a good idea after all...
    // to handle this only once at route level
    throw new Error(`Account state from multiple addresses is not supported for chainId ${this.chainId}`);
  }

  const { accountId } = account;

  const { balance: nativeBalance, assetAmounts } = await fetchAccount(accountId);

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
