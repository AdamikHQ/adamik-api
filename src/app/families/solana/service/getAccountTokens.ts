import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { fetchAccountTokensBalance } from "../backend/node";
import { SolanaService } from "../service";

async function getAccountTokens(
  this: SolanaService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  try {
    const { tokenAmounts, nextPaginationToken } = await fetchAccountTokensBalance(
      this.chainId,
      accountId,
      paginationToken
    );

    return {
      tokens: tokenAmounts,
      pagination: {
        nextPage: nextPaginationToken ?? null,
      },
    };
  } catch (error) {
    console.warn(`/!\\ Failed to fetch account tokens of account ${accountId}:`, error);

    throw new ThirdPartyProviderError("Failed to fetch account tokens");
  }
}

export { getAccountTokens };
