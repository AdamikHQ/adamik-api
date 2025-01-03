import { AccountState, Token, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { fetchAccountData } from "../backend/tronscan";
import { TronService } from "../service";

async function getAccountState(this: TronService, accountId: string): Promise<AccountState> {
  const accountData = await fetchAccountData(accountId);

  // Tronscan instability... in rare cases some data seems wrong or missing?...
  if (accountData?.balance === undefined || accountData?.withPriceTokens === undefined) {
    console.warn(`/!\\ Invalid account data from tron explorer:`, accountData);
    throw new ThirdPartyProviderError("Invalid response received from tron explorer");
  }

  const nativeBalance = BigInt(accountData.balance);

  const tokens: TokenAmount[] = [];
  accountData.withPriceTokens
    ?.filter(
      (tokenData) =>
        // We only support TRC10 and TRC20 token types
        ["trc10", "trc20"].includes(tokenData.tokenType) &&
        // Some special case tokens are irrelevant (e.g main currency TRX is listed as a special TRC10)
        tokenData.tokenId !== "_"
    )
    .forEach((tokenData) => {
      const tokenType = tokenData.tokenType === "trc10" ? TokenType.TRC10 : TokenType.TRC20;

      const token: Token = {
        type: tokenType,
        id: tokenData.tokenId,
        name: tokenData.tokenName,
        ticker: tokenData.tokenAbbr,
        decimals: tokenData.tokenDecimal,
        logo: tokenData.tokenLogo,
      };

      if (tokenType === TokenType.TRC20) {
        token.contractAddress = tokenData.tokenId;
      }

      tokens.push({
        token,
        amount: BigInt(tokenData.balance),
      });
    });

  return {
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
