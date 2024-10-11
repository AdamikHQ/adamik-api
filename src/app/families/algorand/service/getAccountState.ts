import { AccountState, TokenAmount } from "~/app/model/types_WIP";
import { AlgorandService } from ".";
import { fetchAccount } from "../backend/node";

async function getAccountState(this: AlgorandService, accountId: string): Promise<AccountState> {
  const { balance: nativeBalance, assetAmounts } = await fetchAccount(accountId);

  const tokenAmounts: TokenAmount[] = [];

  const tokenDetailsPromises = assetAmounts.map((assetAmount) => {
    return this.getTokenInfo(assetAmount.assetId);
  });

  const tokenDetails = await Promise.all(tokenDetailsPromises);

  tokenDetails.forEach((tokenDetail, index) => {
    if (tokenDetail) tokenAmounts.push({ token: tokenDetail, amount: BigInt(assetAmounts[index].amount) });
  });

  return {
    chainId: this.chainId,
    accountId,
    balances: {
      native: {
        available: BigInt(nativeBalance),
        total: BigInt(nativeBalance),
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAccountState };
