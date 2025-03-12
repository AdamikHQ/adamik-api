import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64 } from "~/app/tools/pagination";
import { fetchAccountTokensData as fetchAccountTokensDataFromOklink } from "../backend/oklink";
import { fetchAccountTokensData as fetchAccountTokensDataFromTronscan } from "../backend/tronscan";
import { TronService } from "../service";
async function getAccountTokens(
  this: TronService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const fetchAccountTokensDataFunctions = [
    fetchAccountTokensDataFromTronscan,
    fetchAccountTokensDataFromOklink,
  ];

  const errors: Error[] = [];

  for (const fetchAccountTokensDataFunction of fetchAccountTokensDataFunctions) {
    try {
      if (fetchAccountTokensDataFunction === fetchAccountTokensDataFromOklink && paginationToken) {
        const paginationData = paginationFromB64(paginationToken);
        if (typeof paginationData === "string") {
          throw new ThirdPartyProviderError(
            "It's seems that default Tron provider is down and you wanted to access to next page, we did try to an another failover provider but the nextPage isn't compatible with it.Please remove the next page token and retry"
          );
        }
      }
      return await fetchAccountTokensDataFunction(accountId, paginationToken);
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next service if available
    }
  }

  return await fetchAccountTokensDataFromTronscan(accountId, paginationToken);
}

export { getAccountTokens };
