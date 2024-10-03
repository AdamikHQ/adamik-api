import { AccountState, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { TronService } from ".";
import { fetchTronscanAccountData } from "../backend/explorer";

async function getAccountState(this: TronService, accountId: string): Promise<AccountState> {
  const accountInfo = await fetchTronscanAccountData(accountId);

  const nativeBalance = accountInfo?.balance ? BigInt(accountInfo.balance) : BigInt(0);

  console.log("accountInfo", accountInfo);

  const tokens: TokenAmount[] = accountInfo.withPriceTokens
    .map((tokenInfo) => {
      if (tokenInfo.tokenType === "trc20") {
        return {
          token: {
            chainId: this.chainId,
            type: TokenType.TRC20,
            id: tokenInfo.tokenId,
            name: tokenInfo.tokenName,
            ticker: tokenInfo.tokenAbbr,
            decimals: tokenInfo.tokenDecimal,
            contractAddress: tokenInfo.tokenId,
            logo: tokenInfo.tokenLogo,
          },
          amount: BigInt(tokenInfo.balance),
        };
      }
      return null;
    })
    .filter(Boolean) as TokenAmount[];

  return {
    chainId: this.chainId,
    accountId: accountId,
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens,
    },
  };
}

export { getAccountState };
