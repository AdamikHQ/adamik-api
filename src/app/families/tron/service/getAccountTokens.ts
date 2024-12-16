import { AccountTokens, Paginated, Token, TokenAmount, TokenType } from "~/app/model/types_WIP";
import { fetchAccountTokensData } from "../backend/tronscan";
import { TronService } from "../service";

async function getAccountTokens(
  this: TronService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const { tokensInfo, nextPage } = await fetchAccountTokensData(accountId, paginationToken);

  const tokens: TokenAmount[] = [];
  tokensInfo?.data
    // FIXME Flaw in that logic: number of results may vary depending on the filtering below
    // Maybe an issue for customers... maybe not?
    // Fixing that would require juggling with multiple calls to the explorer until getting
    // the right number of results; Probably not worth it
    ?.filter(
      (tokenInfo) =>
        // We only support TRC10 and TRC20 token types
        ["trc10", "trc20"].includes(tokenInfo.tokenType) &&
        // Some special case tokens are irrelevant (e.g main currency TRX is listed as a special TRC10)
        tokenInfo.tokenId !== "_"
    )
    .forEach((tokenInfo) => {
      const tokenType = tokenInfo.tokenType === "trc10" ? TokenType.TRC10 : TokenType.TRC20;

      const token: Token = {
        type: tokenType,
        id: tokenInfo.tokenId,
        name: tokenInfo.tokenName,
        ticker: tokenInfo.tokenAbbr,
        decimals: tokenInfo.tokenDecimal,
      };

      if (tokenType === TokenType.TRC20) {
        token.contractAddress = tokenInfo.tokenId;
      }

      tokens.push({
        token,
        amount: BigInt(tokenInfo.balance),
      });
    });

  return {
    tokens,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountTokens };
