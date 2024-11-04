import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { BitcoinService } from ".";

async function getAccountHistory(
  this: BitcoinService,
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
