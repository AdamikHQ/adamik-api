import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { BitcoinService } from "../service";

async function getAccountHistory(
  this: BitcoinService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  // TODO
  throw new UnsupportedFeatureError("Not implemented yet");

  return {
    transactions: [],
    pagination: {
      nextPage: null,
    },
  };
}

export { getAccountHistory };
