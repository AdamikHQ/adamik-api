import { AccountState, TokenAmount, TokenType, TransactionMode } from "~/app/model/types_WIP";
import { fetchAccount, fetchAllAccountASA } from "../backend/node";
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

  const accountAssets = await fetchAllAccountASA(accountId);

  const accountTokenAmounts: TokenAmount[] = [];
  accountAssets.forEach((asset) => {
    accountTokenAmounts.push({
      token: {
        chainId: this.chainId,
        type: TokenType.ASA,
        id: asset.assetParams.assetId,
        name: asset.assetParams.name,
        ticker: asset.assetParams.unitName,
        decimals: asset.assetParams.decimals,
      },
      amount: BigInt(asset.assetHolding.amount),
    });
  });

  return {
    chainId: this.chainId,
    accountId,
    balances: {
      native: {
        available: nativeBalanceAvailable,
        total: nativeBalanceTotal,
      },
      tokens: accountTokenAmounts,
    },
  };
}

export { getAccountState };
