import { AccountTokens, Paginated } from "~/app/model/types_WIP";
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

  let errors: Error[] = [];

  for (const fetchAccountTokensDataFunction of fetchAccountTokensDataFunctions) {
    try {
      return await fetchAccountTokensDataFunction(accountId, paginationToken);
    } catch (error) {
      errors.push(error as Error);
      continue; // Try next service if available
    }
  }

  // That's means even failover didn't work
  console.error(JSON.stringify(errors, null, 2));

  throw new Error(`Failed to fetch account tokens from all backends: ${errors.at(-1)?.message}`);
}

export { getAccountTokens };
