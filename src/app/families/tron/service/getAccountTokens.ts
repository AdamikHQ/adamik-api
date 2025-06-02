import { AccountTokens, Paginated, ProviderType } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationFromB64 } from "~/app/tools/pagination";
import { fetchAccountTokensData as fetchAccountTokensDataFromTronscan } from "../backend/tronscan";
import { TronService } from "../service";

async function getAccountTokens(
  this: TronService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const fetchAccountTokensDataFunctions = [
    {
      type: ProviderType.tronscan,
      fetchAccountTokensDataFunction: fetchAccountTokensDataFromTronscan,
    },
  ];

  const errors: Error[] = [];

  const paginationData = paginationFromB64(paginationToken) as { type: ProviderType; page: number } | null;

  for (const { type, fetchAccountTokensDataFunction } of fetchAccountTokensDataFunctions) {
    try {
      if (!paginationData || type === paginationData.type) {
        return await fetchAccountTokensDataFunction(accountId, paginationToken);
      }
      throw new ThirdPartyProviderError("Failed over detected during pagination");
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next service if available
    }
  }

  console.warn(
    `/!\\ Failed to fetch account tokens of account ${accountId}:`,
    JSON.stringify(errors, null, 2)
  );

  throw new ThirdPartyProviderError("Failed to fetch account tokens");
}

export { getAccountTokens };
