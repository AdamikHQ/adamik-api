import { TronService } from ".";
import { AccountHistory, Paginated } from "../../../model/types_WIP";

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
    nextPage: null,
  };
}

export { getAccountHistory };
