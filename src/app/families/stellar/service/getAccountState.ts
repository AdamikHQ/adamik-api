import { type Horizon } from "@stellar/stellar-sdk";
import { CHAINS } from "~/app/config/chains";
import { AccountState, Token, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { amountToSmallestUnit } from "~/app/tools/amount";
import { fetchAccount } from "../backend/horizon";
import { StellarService } from "../service";

async function getAccountState(this: StellarService, accountId: string): Promise<AccountState> {
  const stellarAccount = await fetchAccount(this.chainId, accountId);
  if (!stellarAccount) {
    return {
      balances: {
        native: {
          available: 0n,
          total: 0n,
        },
      },
    };
  }

  // Extract native XLM balance
  const xlmBalance = stellarAccount.balances.find((balance) => balance.asset_type === "native");
  const xlmBalanceInStroops = xlmBalance
    ? BigInt(amountToSmallestUnit(xlmBalance.balance, CHAINS[this.chainId].decimals) ?? 0)
    : 0n;

  // Extract tokens balances (non-native assets)
  const assetsData = stellarAccount.balances.filter(
    (assetData) =>
      // Asset types from https://github.com/stellar/js-stellar-base/blob/1904c4791eab93f94c3e9bea4a1c44323c585a8c/types/index.d.ts#L54
      assetData.asset_type === "credit_alphanum4" || assetData.asset_type === "credit_alphanum12"
  );

  const chain = CHAINS[this.chainId];
  const tokens: TokenAmount[] = assetsData.map((assetData: Horizon.HorizonApi.BalanceLineAsset) => {
    const token: Token = {
      type: TokenType.STELLAR_ASSET,
      id: `${assetData.asset_code}:${assetData.asset_issuer}`,
      name: assetData.asset_code,
      ticker: assetData.asset_code,
      decimals: chain.decimals,
      contractAddress: assetData.asset_issuer,
    };

    return {
      token,
      amount: BigInt(amountToSmallestUnit(assetData.balance, chain.decimals) ?? 0),
    };
  });

  return {
    balances: {
      native: {
        available: xlmBalanceInStroops,
        total: xlmBalanceInStroops,
      },
      tokens,
    },
  };
}

export { getAccountState };
