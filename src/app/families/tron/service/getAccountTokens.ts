import { AccountTokens, Paginated, ProviderType } from "~/app/model/types_WIP";
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
    {
      providerType: ProviderType.tronscan,
      fetchAccountTokensDataFunction: fetchAccountTokensDataFromTronscan,
    },
    { providerType: ProviderType.oklink, fetchAccountTokensDataFunction: fetchAccountTokensDataFromOklink },
  ];

  const errors: Error[] = [];

  const paginationData = paginationFromB64(paginationToken) as { type: ProviderType; page: number } | null;

  for (const { providerType, fetchAccountTokensDataFunction } of fetchAccountTokensDataFunctions) {
    try {
      if (paginationData === null || (paginationData && providerType === paginationData.type)) {
        return await fetchAccountTokensDataFunction(accountId, paginationToken);
      }
      throw new ThirdPartyProviderError("Failed over detected during pagination");
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next service if available
    }
  }

  throw new ThirdPartyProviderError(
    `/!\\ Failed to fetch account tokens of account ${accountId}: ${JSON.stringify(errors, null, 2)}`
  );
}

export { getAccountTokens };
