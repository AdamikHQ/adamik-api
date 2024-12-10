import { AccountState, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { fetchAccountData } from "../backend/tronscan";
import { TronService } from "../service";

async function getAccountState(this: TronService, accountId: string): Promise<AccountState> {
  const accountData = await fetchAccountData(accountId);

  // Tronscan instability... in rare cases some data seems wrong or missing?...
  if (!accountData?.balance || !accountData?.withPriceTokens) {
    console.warn(`/!\\ Invalid account data from tron explorer:`, accountData);
    throw new ThirdPartyProviderError("Invalid response received from tron explorer");
  }

  const nativeBalance = BigInt(accountData.balance);

  const tokens: TokenAmount[] = accountData.withPriceTokens
    .filter(
      (tokenData) =>
        (tokenData.tokenType === "trc10" || tokenData.tokenType === "trc20") && tokenData.tokenAbbr !== "trx"
    )
    .map((tokenData) => ({
      token: {
        chainId: this.chainId,
        type: tokenData.tokenType === "trc10" ? TokenType.TRC10 : TokenType.TRC20,
        id: tokenData.tokenId,
        name: tokenData.tokenName,
        ticker: tokenData.tokenAbbr,
        decimals: tokenData.tokenDecimal,
        contractAddress: tokenData.tokenId,
        logo: tokenData.tokenLogo,
      },
      amount: BigInt(tokenData.balance),
    }));

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
