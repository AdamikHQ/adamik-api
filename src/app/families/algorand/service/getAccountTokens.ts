import { AccountTokens, Paginated, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { fetchAccountASA } from "../backend/node";
import { AlgorandService } from "../service";

async function getAccountTokens(
  this: AlgorandService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const accountTokenAmounts: TokenAmount[] = [];

  const { accountAssets, nextPage } = await fetchAccountASA(accountId, paginationToken);

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
    tokens: accountTokenAmounts,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
