import { AccountHistory, Paginated } from "../../../model/types_WIP";
import { TronService } from "../service";

async function getAccountHistory(
  this: TronService,
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
