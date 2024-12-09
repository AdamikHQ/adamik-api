import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { AccountHistory, Paginated } from "../../../model/types_WIP";
import { TronService } from "../service";

async function getAccountHistory(
  this: TronService,
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
