import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { BitcoinService } from "../service";

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
    pagination: {
      nextPage: null,
    },
  };
}

export { getAccountHistory };
