import { AccountState, TokenAmount, TransactionMode } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { computeAlgoMaxSpendable } from "../logic";
import { AlgorandService } from "../service";

async function getAccountState(this: AlgorandService, accountId: string): Promise<AccountState> {
  const { balance, assetAmounts } = await fetchAccount(accountId);
  const nativeBalanceTotal = BigInt(balance);
  const nativeBalanceAvailable = computeAlgoMaxSpendable({
    accountBalance: nativeBalanceTotal,
    nbAccountAssets: assetAmounts.length,
    mode: TransactionMode.TRANSFER,
  });

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
        available: nativeBalanceAvailable,
        total: nativeBalanceTotal,
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAccountState };
