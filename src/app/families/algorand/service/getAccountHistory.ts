import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { AlgorandService } from "../service";

async function getAccountHistory(
  this: AlgorandService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  // TODO
  throw new UnsupportedFeatureError("Not implemented yet");

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
