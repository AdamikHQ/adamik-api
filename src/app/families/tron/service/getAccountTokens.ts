import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { fetchAccountTokensData as fetchAccountTokensDataFromTronscan } from "../backend/tronscan";
import { TronService } from "../service";

async function getAccountTokens(
  this: TronService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  return await fetchAccountTokensDataFromTronscan(accountId, paginationToken);
}

export { getAccountTokens };
