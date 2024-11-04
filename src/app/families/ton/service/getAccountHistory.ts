import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { TonService } from ".";

async function getAccountHistory(
  this: TonService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  // TODO

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
    pagination: {
      nextPage: null,
    },
  };
}

export { getAccountHistory };
