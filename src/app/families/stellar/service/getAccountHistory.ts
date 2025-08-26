import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { fetchAccountTransactions } from "../backend/horizon";
import { StellarService } from "../service";

async function getAccountHistory(
  this: StellarService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  const { stellarTransactions, nextPage } = await fetchAccountTransactions(
    this.chainId,
    accountId,
    paginationToken
  );

  return {
    transactions: stellarTransactions,
    pagination: {
      nextPage,
    },
  };
}

export { getAccountHistory };
